"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications";
import { syncGroupConversationMember } from "@/server/data/messaging";

export async function completeOnboardingAction(input: OnboardingInput) {
  const user = await requireUser();
  const parsed = onboardingSchema.parse(input);

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      bio: parsed.bio || null,
      ageRange: parsed.ageRange,
      ministryInterests: parsed.ministryInterests,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { name: `${parsed.firstName} ${parsed.lastName}`, onboardedAt: new Date() },
  });

  await prisma.notificationPreference.createMany({
    data: NOTIFICATION_CATEGORIES.map((category) => ({
      userId: user.id,
      category,
      frequency: parsed.notificationFrequency,
    })),
    skipDuplicates: true,
  });

  for (const groupId of parsed.joinGroupIds) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.privacy !== "OPEN") continue;
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: user.id } },
      update: {},
      create: { groupId, userId: user.id, role: "MEMBER", status: "ACTIVE" },
    });
    await prisma.group.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } });
    await syncGroupConversationMember(groupId, user.id, true);
  }

  revalidatePath("/home");
}
