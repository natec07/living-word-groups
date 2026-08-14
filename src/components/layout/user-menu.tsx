"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bookmark, Calendar, LayoutDashboard, LogOut, Settings, UserCircle, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";

export function UserMenu({
  name,
  email,
  image,
  firstName,
  lastName,
  canAccessAdmin = false,
}: {
  name: string;
  email: string;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  canAccessAdmin?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-9 w-9">
          <AvatarImage src={image ?? undefined} alt={name} />
          <AvatarFallback>{initials(firstName, lastName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="font-medium">{name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserCircle className="h-4 w-4" /> Your profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/events" />}>
          <Calendar className="h-4 w-4" /> Events
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/directory" />}>
          <Users className="h-4 w-4" /> Member directory
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/saved" />}>
          <Bookmark className="h-4 w-4" /> Saved
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="h-4 w-4" /> Settings
        </DropdownMenuItem>
        {canAccessAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <LayoutDashboard className="h-4 w-4" /> Admin dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
