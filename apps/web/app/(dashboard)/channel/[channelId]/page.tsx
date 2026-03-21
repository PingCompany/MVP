"use client";

import { use, useState } from "react";
import { MessageList, type Message } from "@/components/channel/MessageList";
import { AlertBanner } from "@/components/proactive/AlertBanner";

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    type: "user",
    author: "Alex Chen",
    authorInitials: "AC",
    content: "Hey, can anyone explain how the auth token refresh works in the current codebase?",
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: "2",
    type: "user",
    author: "Sarah Kim",
    authorInitials: "SK",
    content: "I think it's tied to the WorkOS session — but I'm not 100% sure of the exact flow. @KnowledgeBot can you explain?",
    timestamp: new Date(Date.now() - 24 * 60 * 1000),
  },
  {
    id: "3",
    type: "bot",
    author: "KnowledgeBot",
    authorInitials: "KB",
    botName: "KnowledgeBot",
    content: "Based on the codebase and recent discussions:\n\nAuth tokens are fetched from /api/auth/token, which uses the WorkOS withAuth middleware. The Convex client refreshes these tokens automatically via ConvexProviderWithAuth. The token TTL is 60 minutes, and WorkOS handles session renewal transparently.\n\nThis was refactored in PR #189 after the original JWT expiry bug reported in December.",
    timestamp: new Date(Date.now() - 23 * 60 * 1000),
    citations: [
      { type: "pr",      label: "PR #189",      url: "#" },
      { type: "ticket",  label: "ENG-441",      url: "#" },
      { type: "commit",  label: "a7f3c2d",      url: "#" },
      { type: "message", label: "Dec 12 thread", url: "#" },
    ],
  },
  {
    id: "4",
    type: "user",
    author: "Alex Chen",
    authorInitials: "AC",
    content: "Perfect, that's exactly what I needed. So if I'm testing locally I just need to hit that endpoint first?",
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
  },
  {
    id: "5",
    type: "user",
    author: "Sarah Kim",
    authorInitials: "SK",
    content: "Yes, and make sure WORKOS_CLIENT_ID is set in your .env.local or the withAuth will 401.",
    timestamp: new Date(Date.now() - 19 * 60 * 1000),
  },
  {
    id: "6",
    type: "user",
    author: "Tom Walsh",
    authorInitials: "TW",
    content: "Also — heads up the staging deploy is locked until the failing check on PR #234 is resolved. @Alex can you take a look today?",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
];

interface Props {
  params: Promise<{ channelId: string }>;
}

export default function ChannelPage({ params }: Props) {
  const { channelId } = use(params);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [showAlert, setShowAlert] = useState(true);

  const handleSend = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        type: "user",
        author: "You",
        authorInitials: "U",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="relative flex h-full flex-col">
      <MessageList
        channelName={channelId}
        messages={messages}
        onSend={handleSend}
      />

      {showAlert && (
        <AlertBanner
          title="Blocked Task Alert"
          description="PR #234 is blocking the staging deploy. You're the assigned reviewer."
          actions={[
            { label: "Review PR #234", primary: true },
            { label: "Ping Tom" },
          ]}
          onDismiss={() => setShowAlert(false)}
        />
      )}
    </div>
  );
}
