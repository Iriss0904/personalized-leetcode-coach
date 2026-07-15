import {
  BookOpen,
  BookText,
  CalendarDays,
  Code2,
  type LucideIcon,
  MessageSquare,
  NotebookPen,
  UserRound,
} from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const SIDEBAR_NAV: SidebarNavItem[] = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/workbench", label: "Workbench", icon: Code2 },
  { href: "/history/problems", label: "Problem History", icon: BookOpen },
  { href: "/profile", label: "Skill Profile", icon: UserRound },
  { href: "/notebook", label: "Mistake Book", icon: NotebookPen },
  { href: "/handbook", label: "Knowledge Handbook", icon: BookText },
  { href: "/history/chats", label: "Chat History", icon: MessageSquare },
];
