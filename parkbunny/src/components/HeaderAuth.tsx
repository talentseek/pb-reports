"use client";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function HeaderAuth() {
  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <nav className="space-x-4 text-sm">
          <Link href="/sign-in">Sign in</Link>
        </nav>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}


