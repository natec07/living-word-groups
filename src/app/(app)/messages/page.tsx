import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getInboxConversations } from "@/server/data/messaging";
import { ButtonLink } from "@/components/ui/button-link";
import { MessagesInbox } from "@/components/messaging/messages-inbox";

export default async function MessagesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const conversations = await getInboxConversations(userId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Messages</h1>
        <ButtonLink href="/messages/new">
          <Plus className="h-4 w-4" /> New message
        </ButtonLink>
      </div>

      <MessagesInbox initialConversations={conversations} />
    </div>
  );
}
