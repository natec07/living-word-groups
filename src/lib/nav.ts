import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Home,
  LayoutDashboard,
  MessageCircle,
  Users,
  Users2,
  UserCircle,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Create lives outside this list as a FAB. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users2 },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

/** Desktop has room for the full set — messages/events stay one click away. */
export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: Users2 },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Admin Dashboard",
  icon: LayoutDashboard,
};
