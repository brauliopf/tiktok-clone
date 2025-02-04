"use client";

import { useUser } from "@clerk/nextjs";
import LandingPage from "../../components/landing";
import Feed from "@/components/feed";

export default function Landing() {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <div className="flex min-h-screen justify-center items-center fixed left-0 right-0 overflow-auto">
      <main className="flex flex-col gap-10 items-center mb-10 max-h-screen">
        {/* HANDLE GLITCH BEFORE ONBOARDING */}
        {user ? <LandingPage /> : <Feed />}
      </main>
    </div>
  );
}
