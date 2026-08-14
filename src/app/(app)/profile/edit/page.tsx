import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";

export default async function EditProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold">Edit profile</h1>
      <p className="mt-1 text-muted-foreground">Control what you share and who can see it.</p>
      <div className="mt-6">
        <AvatarUpload currentUrl={profile.avatarUrl} firstName={profile.firstName} lastName={profile.lastName} />
      </div>
      <div className="mt-6 border-t border-border pt-6">
        <EditProfileForm
          profile={{
            firstName: profile.firstName,
            lastName: profile.lastName,
            bio: profile.bio ?? "",
            ageRange: profile.ageRange ?? "",
            preferredLanguage: profile.preferredLanguage ?? "en",
            ministryInterests: profile.ministryInterests,
            serveInterests: profile.serveInterests,
            visibility: (profile.visibility as Record<string, "PUBLIC" | "MEMBERS" | "PRIVATE">) ?? {},
          }}
        />
      </div>
    </div>
  );
}
