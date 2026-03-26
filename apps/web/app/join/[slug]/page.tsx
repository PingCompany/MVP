"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, CheckCircle2, XCircle, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigateToWorkspace } from "@/lib/workspace-url";

interface Props {
  params: Promise<{ slug: string }>;
}

type ActionState =
  | { kind: "idle" }
  | { kind: "joining" }
  | { kind: "requestSent" }
  | { kind: "alreadyMember" }
  | { kind: "error"; message: string };

export default function JoinPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  const workspace = useQuery(api.workspaces.getPublicInfo, { slug });
  const joinWorkspace = useMutation(api.workspaces.joinViaPublicLink);
  const submitRequest = useMutation(api.accessRequests.submit);

  const [action, setAction] = useState<ActionState>({ kind: "idle" });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const isLoading = authLoading || workspace === undefined;

  async function handleJoin() {
    setAction({ kind: "joining" });
    try {
      const result = await joinWorkspace({ slug });
      if (result.alreadyMember) {
        setAction({ kind: "alreadyMember" });
      } else {
        navigateToWorkspace(result.slug);
      }
    } catch (err) {
      setAction({ kind: "error", message: err instanceof Error ? err.message : "Failed to join workspace" });
    }
  }

  async function handleRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAction({ kind: "joining" });
    try {
      await submitRequest({
        slug,
        email: email.trim(),
        name: name.trim() || undefined,
        message: message.trim() || undefined,
      });
      setAction({ kind: "requestSent" });
    } catch (err) {
      setAction({ kind: "error", message: err instanceof Error ? err.message : "Failed to submit request" });
    }
  }

  if (action.kind === "joining" || isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-ping-purple" />
        <p className="text-sm text-muted-foreground">
          {action.kind === "joining" ? "Joining..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (workspace === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">Workspace not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The workspace &ldquo;{slug}&rdquo; doesn&apos;t exist or the link is invalid.
          </p>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="bg-ping-purple text-white hover:bg-ping-purple-hover"
        >
          Go to workspaces
        </Button>
      </div>
    );
  }

  if (action.kind === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
          <p className="mt-1 text-sm text-muted-foreground">{action.message}</p>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="bg-ping-purple text-white hover:bg-ping-purple-hover"
        >
          Go to workspaces
        </Button>
      </div>
    );
  }

  if (action.kind === "alreadyMember") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <CheckCircle2 className="h-10 w-10 text-status-online" />
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">You&apos;re already a member</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You already belong to {workspace.name}.
          </p>
        </div>
        <Button
          onClick={() => navigateToWorkspace(slug)}
          className="bg-ping-purple text-white hover:bg-ping-purple-hover"
        >
          Go to workspace <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (action.kind === "requestSent") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <CheckCircle2 className="h-10 w-10 text-status-online" />
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">Request submitted</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll notify you when approved.
          </p>
        </div>
        <Button
          onClick={() => router.push("/")}
          variant="outline"
        >
          Back to home
        </Button>
      </div>
    );
  }

  const publicJoinEnabled = workspace.publicInviteEnabled;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <div className="text-center">
        <UserPlus className="mx-auto mb-3 h-10 w-10 text-ping-purple" />
        <h1 className="text-xl font-semibold text-foreground">
          Join {workspace.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {publicJoinEnabled
            ? "This workspace is open for anyone to join."
            : "Request access to this workspace."}
        </p>
      </div>

      {publicJoinEnabled && (
        isAuthenticated ? (
          <Button
            onClick={handleJoin}
            className="bg-ping-purple text-white hover:bg-ping-purple-hover"
            size="lg"
          >
            Join {workspace.name} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              window.location.href = `/sign-in?returnTo=${encodeURIComponent(`/join/${slug}`)}`;
            }}
            className="bg-ping-purple text-white hover:bg-ping-purple-hover"
            size="lg"
          >
            Sign in to join
          </Button>
        )
      )}

      {publicJoinEnabled && !showRequestForm && (
        <button
          onClick={() => setShowRequestForm(true)}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Or request access instead
        </button>
      )}

      {(!publicJoinEnabled || showRequestForm) && (
        <form
          onSubmit={handleRequestAccess}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <input
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-purple"
          />
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-purple"
          />
          <textarea
            placeholder="Why do you want to join? (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ping-purple"
          />
          <Button
            type="submit"
            className="bg-ping-purple text-white hover:bg-ping-purple-hover"
          >
            Request access
          </Button>
        </form>
      )}
    </div>
  );
}
