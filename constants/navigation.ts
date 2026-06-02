import { LayoutDashboard, Users, FileCheck, BookOpen, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Partners",  href: "/partners",  icon: Users },
  { label: "KYC Queue", href: "/kyc",      icon: FileCheck },
  { label: "Bookings",  href: "/bookings", icon: BookOpen },
];
