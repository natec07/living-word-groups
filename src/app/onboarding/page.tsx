import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, ministries, openGroups] = await Promise.all([
    prisma.profile.findUniqueOrThrow({ where: { userId } }),
    prisma.ministry.findMany({ orderBy: { name: "asc" } }),
    prisma.group.findMany({ where: { privacy: "OPEN" }, take: 6, orderBy: { name: "asc" } }),
  ]);

  return (
    <OnboardingWizard
      profile={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio ?? "",
        ageRange: profile.ageRange ?? "",
        avatarUrl: profile.avatarUrl,
      }}
      ministries={ministries.map((m) => ({ id: m.id, name: m.name }))}
      openGroups={openGroups.map((g) => ({ id: g.id, name: g.name, description: g.description }))}
    />
  );
}
