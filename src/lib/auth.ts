import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions, getUserRoleKeys } from "@/lib/authz";
import type { PermissionKey, RoleKeyType } from "@/lib/rbac";
import { sendMagicLinkEmail } from "@/lib/email/send";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      status: string;
      roles: RoleKeyType[];
      permissions: PermissionKey[];
      onboarded: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    status?: string;
    roles?: RoleKeyType[];
    permissions?: PermissionKey[];
    onboarded?: boolean;
  }
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user?.hashedPassword) return null;
      if (user.status === "SUSPENDED" || user.status === "DELETED") {
        throw new Error("This account is no longer active. Contact the church office for help.");
      }

      const valid = await bcrypt.compare(password, user.hashedPassword);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
  Resend({
    from: process.env.EMAIL_FROM,
    sendVerificationRequest: async ({ identifier, url }) => {
      await sendMagicLinkEmail(identifier, url);
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/check-email",
    newUser: "/onboarding",
  },
  providers,
  events: {
    async createUser({ user }) {
      // Fires once when the adapter creates a brand-new user row
      // (OAuth or magic-link sign-up). Give them the baseline Member
      // role so RBAC checks have something to work with.
      if (!user.id) return;
      const memberRole = await prisma.role.findUnique({ where: { key: "MEMBER" } });
      if (memberRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: memberRole.id },
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      const userId = user?.id ?? token.id;
      if (!userId) return token;
      token.id = userId as string;

      if (trigger === "update" || !token.roles) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId as string },
          select: { status: true, onboardedAt: true },
        });
        if (!dbUser) return token;
        token.status = dbUser.status;
        token.onboarded = !!dbUser.onboardedAt;
        token.roles = await getUserRoleKeys(userId as string);
        token.permissions = await getEffectivePermissions(userId as string);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.status = token.status ?? "PENDING_APPROVAL";
      session.user.roles = token.roles ?? [];
      session.user.permissions = token.permissions ?? [];
      session.user.onboarded = token.onboarded ?? false;
      return session;
    },
  },
});
