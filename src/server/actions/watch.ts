"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/authz";

export async function saveVideoProgressAction(videoId: string, positionSeconds: number) {
  const user = await requireActiveUser();
  const video = await prisma.video.findUniqueOrThrow({ where: { id: videoId } });

  const clampedPosition = Math.max(0, Math.min(positionSeconds, video.durationSeconds ?? positionSeconds));
  const completed = video.durationSeconds ? clampedPosition >= video.durationSeconds * 0.9 : false;

  await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId: user.id, videoId } },
    update: { positionSeconds: clampedPosition, completed },
    create: { userId: user.id, videoId, positionSeconds: clampedPosition, completed },
  });
}

export async function toggleBookmarkVideoAction(videoId: string) {
  const user = await requireActiveUser();
  const existing = await prisma.bookmark.findFirst({ where: { userId: user.id, videoId, type: "VIDEO" } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.bookmark.create({ data: { userId: user.id, type: "VIDEO", videoId } });
  return true;
}

export async function markVideoStartedAction(videoId: string) {
  const user = await requireActiveUser();
  await prisma.video.update({ where: { id: videoId }, data: { viewCount: { increment: 1 } } });
  await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId: user.id, videoId } },
    update: {},
    create: { userId: user.id, videoId, positionSeconds: 0 },
  });
  revalidatePath(`/watch`);
}
