"use client";

import { useRouter } from "next/navigation";
import {
  Inbox,
  Hash,
  Users,
  Bot,
  GitBranch,
  BarChart2,
  Shield,
  PanelLeftClose,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleSidebar?: () => void;
}

const PAGES = [
  { label: "Inbox",           href: "/inbox",                     icon: Inbox,     shortcut: "G I" },
  { label: "Profile",         href: "/settings/profile",          icon: User },
  { label: "Team",            href: "/settings/team",             icon: Users },
  { label: "Agents",          href: "/settings/agents",           icon: Bot },
  { label: "Knowledge Graph", href: "/settings/knowledge-graph",  icon: GitBranch },
  { label: "Analytics",       href: "/settings/analytics",        icon: BarChart2 },
  { label: "Backoffice",      href: "/admin",                     icon: Shield },
];

const CHANNELS = [
  { id: "general",     name: "general" },
  { id: "engineering", name: "engineering" },
  { id: "design",      name: "design" },
  { id: "product",     name: "product" },
];

export function CommandPalette({ open, onOpenChange, onToggleSidebar }: CommandPaletteProps) {
  const router = useRouter();

  const navigate = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, channels, commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          {PAGES.map(({ label, href, icon: Icon, shortcut }) => (
            <CommandItem key={href} onSelect={() => navigate(href)}>
              <Icon className="h-3.5 w-3.5 text-white/40" />
              <span>{label}</span>
              {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Channels">
          {CHANNELS.map(({ id, name }) => (
            <CommandItem key={id} onSelect={() => navigate(`/channel/${id}`)}>
              <Hash className="h-3.5 w-3.5 text-white/40" />
              <span>{name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Commands">
          <CommandItem
            onSelect={() => {
              onToggleSidebar?.();
              onOpenChange(false);
            }}
          >
            <PanelLeftClose className="h-3.5 w-3.5 text-white/40" />
            <span>Toggle sidebar</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
