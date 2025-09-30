"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarIcon } from "lucide-react";

//import { SearchForm } from "@/components/search-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean); // ["dashboard", "industry-insights"]

  // Optional: Map URL segments to friendly names
  const segmentNames: Record<string, string> = {
    dashboard: "Dashboard",
    "industry-insights": "Industry Insights",
    "career-roadmap": "Career Roadmap",
    "interview-prep": "Interview Prep",
    "smart-assessment": "Smart Assessment",
    "cover-letter": "Cover Letter",
    "resume-builder": "Resume Builder",
    onboarding: "Profile",
  };

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <SignedIn>
          {/* Sidebar toggle button */}
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <SidebarIcon />
          </Button>

          <Separator orientation="vertical" className="mr-2 h-4" />

          {/* Breadcrumbs */}
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              {segments.length === 0 ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                segments.map((segment, idx) => {
                  const path = "/" + segments.slice(0, idx + 1).join("/");
                  const isLast = idx === segments.length - 1;
                  const label =
                    segmentNames[segment] || segment.replace(/-/g, " ");

                  return (
                    <React.Fragment key={path}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })
              )}
            </BreadcrumbList>
          </Breadcrumb>
          {/* Search form */}
          {/* <SearchForm className="w-full sm:ml-auto sm:w-auto" /> */}
          <div className="ml-auto flex items-center gap-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </div>
        </SignedIn>

        <SignedOut>
          <Link href="/">
            <Image
              src="/cezai-logo-light.png"
              alt="CEZAI Logo"
              width={200}
              height={60}
              className="h-10 py-1 w-auto object-contain"
            />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Sign Up</Button>
            </SignUpButton>
          </div>
        </SignedOut>
      </div>
    </header>
  );
}
