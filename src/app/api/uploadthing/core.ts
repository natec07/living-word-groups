import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { revalidatePath } from "next/cache";
import { requireActiveUser, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        const user = await requireActiveUser();
        return { userId: user.id };
      } catch {
        throw new UploadThingError("You must be signed in to upload a photo");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.profile.update({
        where: { userId: metadata.userId },
        data: { avatarUrl: file.ufsUrl },
      });
      revalidatePath("/profile");
      revalidatePath("/profile/edit");
      revalidatePath("/directory");
      return { avatarUrl: file.ufsUrl };
    }),

  // Group-chat image attachments — the message itself (with the resulting
  // URLs) is created separately by sendMessageAction once the composer
  // has finished uploading, so nothing is written to the DB here.
  chatImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 4 } })
    .middleware(async () => {
      try {
        const user = await requireActiveUser();
        return { userId: user.id };
      } catch {
        throw new UploadThingError("You must be signed in to share a photo");
      }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  // Voice messages — recorded client-side via MediaRecorder, uploaded
  // here, then attached to a message by sendMessageAction the same way
  // chatImageUploader's URLs are.
  chatAudioUploader: f({ audio: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        const user = await requireActiveUser();
        return { userId: user.id };
      } catch {
        throw new UploadThingError("You must be signed in to send a voice message");
      }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  // Group/space cover banners — admin-only. The upload just returns a URL;
  // updateGroupCoverAction/updateSpaceCoverAction persist it once the
  // caller knows which group or space it belongs to.
  coverImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      try {
        await requirePermission("groups.manage_all");
        return {};
      } catch {
        throw new UploadThingError("You don't have permission to change cover images");
      }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
