"use client";
// src/components/layout/Navbar.tsx
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">
              MediBridge
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-400 sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-lg p-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">Sign out</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
