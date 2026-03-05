"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { LogOut, MessageSquare, Moon, Sun, User2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import { NewDirectMessage } from "./new-direct-message";

function OnlineDot({ userId }: { userId: string }) {
  // We use a query per DM — only rendered for each contact
  const presenceData = useQuery(api.functions.presence.get, {
    userId: userId as never,
  });
  if (!presenceData?.online) return null;
  return (
    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-sidebar ring-0 shadow-sm" />
  );
}

export function DashboardSidebar() {
  const user = useQuery(api.functions.user.get);
  // Skip dm.list when unauthenticated to prevent Unauthorized errors during sign-out
  const directMessages = useQuery(
    api.functions.dm.list,
    user !== undefined && user !== null ? {} : "skip"
  );
  const { signOut } = useClerk();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Presence heartbeat — ping every 30s while tab is open
  const upsertPresence = useMutation(api.functions.presence.upsert);
  const setOffline = useMutation(api.functions.presence.setOffline);

  useEffect(() => {
    if (!user) return;
    upsertPresence();
    const interval = setInterval(() => upsertPresence(), 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setOffline();
      } else {
        upsertPresence();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", () => setOffline());
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, upsertPresence, setOffline]);

  if (!user) return null;

  return (
    <Sidebar>
      {/* App header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-sidebar-border">
        <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow shadow-indigo-500/30 shrink-0">
          <MessageSquare className="size-3.5 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight">ChatterBox</span>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/" || pathname === "/friends"}>
                  <Link href="/friends">
                    <User2Icon />
                    Friends
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroup>
            <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
            <NewDirectMessage />
            <SidebarGroupContent>
              <SidebarMenu>
                {directMessages?.map((dm) => (
                  <SidebarMenuItem key={dm._id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/dms/${dm._id}`}
                      className="h-auto py-2"
                    >
                      <Link href={`/dms/${dm._id}`}>
                        <div className="relative shrink-0">
                          <Avatar className="size-7">
                            <AvatarImage src={dm.user.image} />
                            <AvatarFallback className="text-[10px]">
                              {dm.user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <OnlineDot userId={dm.user._id} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="font-medium text-sm truncate leading-tight">
                            {dm.user.username}
                          </p>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="h-auto py-2">
                      <div className="relative shrink-0">
                        <Avatar className="size-7">
                          <AvatarImage src={user?.image} />
                          <AvatarFallback className="text-[10px]">
                            {user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-sidebar" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="font-medium text-sm truncate leading-tight">
                          {user.username}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Online
                        </p>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-48">
                    <DropdownMenuItem
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                    >
                      {theme === "dark" ? (
                        <Sun className="size-4" />
                      ) : (
                        <Moon className="size-4" />
                      )}
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => signOut({ redirectUrl: "/sign-in" })}
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
