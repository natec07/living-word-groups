import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StartConversationForm } from "@/components/messaging/start-conversation-form";

export default async function NewMessagePage() {
  const session = await auth();
  const userId = session!.user.id;

  const members = await prisma.profile.findMany({
    where: { userId: { not: userId }, user: { status: "ACTIVE" } },
    select: { userId: true, firstName: true, lastName: true, avatarUrl: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">New message</h1>
      <div className="mt-6">
        <StartConversationForm members={members} />
      </div>
    </div>
  );
}
