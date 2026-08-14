"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/profile";

export async function updateProfileAction(input: UpdateProfileInput) {
  const user = await requireActiveUser();
  const parsed = updateProfileSchema.parse(input);

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      bio: parsed.bio,
      ageRange: parsed.ageRange,
      preferredLanguage: parsed.preferredLanguage,
      birthdayMonth: parsed.birthdayMonth,
      birthdayDay: parsed.birthdayDay,
      ministryInterests: parsed.ministryInterests,
      serveInterests: parsed.serveInterests,
      visibility: parsed.visibility,
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { name: `${parsed.firstName} ${parsed.lastName}` } });

  revalidatePath("/profile");
  revalidatePath("/directory");
}

export async function updateAvatarAction(avatarSeed: string) {
  const user = await requireActiveUser();
  await prisma.profile.update({
    where: { userId: user.id },
    data: { avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}` },
  });
  revalidatePath("/profile");
}
