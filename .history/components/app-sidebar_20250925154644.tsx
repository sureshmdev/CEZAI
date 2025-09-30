"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  FileQuestionMark,
  Command,
  Frame,
  LifeBuoy,
  PieChart,
  Send,
  Map,
  UserRoundPen,
} from "lucide-react";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navMainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: PieChart,
    isActive: true,
  },
  {
    title: "Roadmap",
    url: "/resume-builder",
    icon: BookOpen,
  },
  {
    title: "Resume",
    url: "/resume-builder",
    icon: BookOpen,
  },
  {
    title: "Cover Letter",
    url: "/cover-letter",
    icon: Frame,
  },
  {
    title: "Smart Assessment",
    url: "/smart-assessment",
    icon: FileQuestionMark,
  },
  {
    title: "Interview Prep",
    url: "/interview-prep",
    icon: Bot,
  },
  {
    title: "Profile",
    url: "/onboarding",
    icon: UserPen,
  },
];

const navSecondaryItems = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  return (
    <SignedIn>
      <Sidebar
        className="flex flex-col fixed left-0 top-[var(--header-height)] h-[calc(100vh-var(--header-height))]"
        {...props}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/dashboard">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">CEZAI</span>
                    <span className="truncate text-xs">Career Advisor</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto">
          <NavMain items={navMainItems} />
          <NavSecondary items={navSecondaryItems} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="w-full"
                onClick={() => {
                  // Find the Clerk UserButton and programmatically click it
                  const userButton = document.querySelector(
                    '[data-clerk-ui-component="UserButton"]'
                  );
                  if (userButton) {
                    (userButton as HTMLElement).click();
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.fullName || user?.username || "User Account"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.primaryEmailAddress?.emailAddress ||
                        "Manage your profile"}
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SignedIn>
  );
}
