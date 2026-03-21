"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Inbox,
  Hash,
  Plus,
  Search,
  Users,
  Bot,
  GitBranch,
  BarChart2,
  Settings,
  ChevronDown,
  User,
  Keyboard,
  LogOut,
  Lock,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { StatusDot } from "@/components/ui/status-dot";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SIDEBAR_WIDTH } from "@/lib/constants";

const DEFAULT_CHANNELS = [
  { id: "general", name: "general", unread: 0 },
  { id: "engineering", name: "engineering", unread: 5 },
  { id: "design", name: "design", unread: 0 },
  { id: "product", name: "product", unread: 2 },
];

const MOCK_INBOX_COUNT = 3;

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  kbd?: string;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, badge, kbd, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-7 items-center gap-2 rounded px-2 text-sm",
        "transition-colors duration-100",
        isActive
          ? "bg-ping-purple-muted text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-0.5 before:rounded-r before:bg-ping-purple"
          : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>

      {badge != null && badge > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ping-purple px-1 text-2xs font-medium text-white tabular-nums">
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {kbd && !badge && (
        <Kbd className="opacity-0 transition-opacity group-hover:opacity-100">{kbd}</Kbd>
      )}
    </Link>
  );
}

interface SectionHeaderProps {
  label: string;
  action?: React.ReactNode;
}

function SectionHeader({ label, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 pb-0.5 pt-4">
      <span className="text-2xs font-medium uppercase tracking-widest text-white/25">
        {label}
      </span>
      {action}
    </div>
  );
}

interface SidebarProps {
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
}

export function Sidebar({ onOpenSearch, onOpenShortcuts }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);

  const handleCreateChannel = () => {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name || channels.some((c) => c.id === name)) return;
    setChannels((prev) => [...prev, { id: name, name, unread: 0 }]);
    setNewChannelName("");
    setNewChannelPrivate(false);
    setAddChannelOpen(false);
    router.push(`/channel/${name}`);
  };

  return (
    <div
      className="flex h-full flex-col border-r border-subtle bg-surface-1"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Workspace header */}
      <div className="flex h-12 items-center justify-between px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-surface-3">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-ping-purple text-2xs font-bold text-white">
                P
              </div>
              <span className="text-sm font-semibold text-foreground">PING</span>
              <ChevronDown className="h-3 w-3 text-white/30 group-hover:text-white/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-surface-2 border-subtle">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-ping-purple text-2xs font-bold text-white">P</div>
              <div>
                <p className="text-xs font-medium text-foreground">PING Workspace</p>
                <div className="flex items-center gap-1">
                  <StatusDot variant="online" size="xs" />
                  <span className="text-2xs text-muted-foreground">Connected</span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => router.push("/settings/team")}>
              <Settings className="mr-2 h-3 w-3" />
              Workspace settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => router.push("/settings/team")}>
              <Users className="mr-2 h-3 w-3" />
              Invite members
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              className="cursor-pointer text-xs text-destructive focus:text-destructive"
              onClick={() => (window.location.href = "/login")}
            >
              <LogOut className="mr-2 h-3 w-3" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <StatusDot variant="online" size="xs" />
      </div>

      {/* Search */}
      <div className="px-2 pb-1">
        <button
          onClick={onOpenSearch}
          className="group flex h-7 w-full items-center gap-2 rounded px-2 text-sm text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search...</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <div className="h-px bg-white/[0.05] mx-2" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2 scrollbar-thin">
        {/* Primary nav */}
        <NavItem
          href="/inbox"
          icon={Inbox}
          label="Inbox"
          badge={MOCK_INBOX_COUNT}
          kbd="G I"
          isActive={pathname === "/inbox"}
        />

        {/* Channels */}
        <SectionHeader
          label="Channels"
          action={
            <button
              onClick={() => setAddChannelOpen(true)}
              className="rounded p-0.5 text-white/25 transition-colors hover:bg-surface-3 hover:text-white/60"
            >
              <Plus className="h-3 w-3" />
            </button>
          }
        />

        {channels.map((channel) => {
          const isActive = pathname === `/channel/${channel.id}`;
          return (
            <Link
              key={channel.id}
              href={`/channel/${channel.id}`}
              className={cn(
                "group relative flex h-7 items-center gap-2 rounded px-2 text-sm",
                "transition-colors duration-100",
                isActive
                  ? "bg-ping-purple-muted text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:-translate-y-1/2 before:w-0.5 before:rounded-r before:bg-ping-purple"
                  : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
              )}
            >
              <span className="text-2xs font-medium text-white/30">#</span>
              <span className="flex-1 truncate">{channel.name}</span>
              {channel.unread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1 text-2xs font-medium text-white/70 tabular-nums">
                  {channel.unread}
                </span>
              )}
            </Link>
          );
        })}

        {/* Settings */}
        <SectionHeader label="Settings" />

        <NavItem href="/settings/profile" icon={User} label="Profile" isActive={pathname === "/settings/profile"} />
        <NavItem href="/settings/team" icon={Users} label="Team" isActive={pathname === "/settings/team"} />
        <NavItem href="/settings/agents" icon={Bot} label="Agents" isActive={pathname === "/settings/agents"} />
        <NavItem href="/settings/knowledge-graph" icon={GitBranch} label="Knowledge Graph" isActive={pathname === "/settings/knowledge-graph"} />
        <NavItem href="/settings/analytics" icon={BarChart2} label="Analytics" isActive={pathname === "/settings/analytics"} />

        {/* Admin */}
        <SectionHeader label="Admin" />
        <NavItem href="/admin" icon={Settings} label="Backoffice" isActive={pathname.startsWith("/admin")} />
      </nav>

      {/* User row */}
      <div className="border-t border-subtle px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex h-8 w-full items-center gap-2 rounded px-2 transition-colors hover:bg-surface-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ping-purple text-2xs font-medium text-white">
                U
              </div>
              <span className="flex-1 truncate text-left text-sm text-muted-foreground group-hover:text-foreground">
                User
              </span>
              <Kbd className="opacity-0 group-hover:opacity-100">⌘B</Kbd>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-48 bg-surface-2 border-subtle">
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-foreground">User</p>
              <p className="text-2xs text-muted-foreground">user@company.com</p>
            </div>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => router.push("/settings/profile")}>
              <User className="mr-2 h-3 w-3" />
              Profile settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs" onClick={onOpenShortcuts}>
              <Keyboard className="mr-2 h-3 w-3" />
              Keyboard shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              className="cursor-pointer text-xs text-destructive focus:text-destructive"
              onClick={() => (window.location.href = "/login")}
            >
              <LogOut className="mr-2 h-3 w-3" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Add Channel Dialog */}
      <Dialog open={addChannelOpen} onOpenChange={setAddChannelOpen}>
        <DialogContent className="border-subtle bg-surface-2 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Create channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <label className="mb-1.5 block text-2xs font-medium uppercase tracking-widest text-white/40">
                Channel name
              </label>
              <input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                placeholder="e.g. announcements"
                className="w-full rounded border border-subtle bg-surface-3 px-2.5 py-1.5 text-xs text-foreground placeholder:text-white/25 focus:border-white/20 focus:outline-none"
                autoFocus
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newChannelPrivate}
                onChange={(e) => setNewChannelPrivate(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-subtle bg-surface-3"
              />
              <div className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-white/30" />
                <span className="text-xs text-muted-foreground">Private channel</span>
              </div>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAddChannelOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newChannelName.trim()}
                className="h-7 bg-ping-purple text-xs text-white hover:bg-ping-purple-hover disabled:opacity-40"
                onClick={handleCreateChannel}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
