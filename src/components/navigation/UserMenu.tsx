import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  user: User;
  currentPath: string;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/";
      } else {
        alert("Failed to sign out");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get first letter of email for avatar
  const avatarLetter = user.email?.[0]?.toUpperCase() || "U";

  // Truncate email for display
  const displayEmail = user.email && user.email.length > 20
    ? user.email.substring(0, 20) + "..."
    : user.email;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="size-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {avatarLetter}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-emerald-100">
          {displayEmail}
        </span>
        <svg
          className={`size-4 text-emerald-200 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-emerald-500/30 bg-gradient-to-b from-green-900/95 to-emerald-900/95 backdrop-blur-xl shadow-2xl z-50">
          {/* User Info Header */}
          <div className="border-b border-emerald-500/20 px-4 py-3">
            <p className="text-sm font-medium text-emerald-100 truncate">
              {user.email}
            </p>
            <p className="text-xs text-emerald-200/60 mt-1">
              Player Account
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-emerald-100 hover:bg-white/10 transition-colors"
            >
              👤 Profile Settings
            </a>

            {/* TODO: Show these items based on user permissions from database */}
            {/* These would require fetching user profile with role/permissions */}
            {/*
            <a
              href="/photos/submit"
              className="block px-4 py-2 text-sm text-emerald-100 hover:bg-white/10 transition-colors"
            >
              📸 Submit Photo
            </a>
            <a
              href="/photos/my-submissions"
              className="block px-4 py-2 text-sm text-emerald-100 hover:bg-white/10 transition-colors"
            >
              📋 My Submissions
            </a>
            */}

            <div className="border-t border-emerald-500/20 my-2" />

            <a
              href="/play/normal"
              className="block px-4 py-2 text-sm text-emerald-100 hover:bg-white/10 transition-colors"
            >
              🎮 Normal Mode
            </a>
            <a
              href="/play/daily"
              className="block px-4 py-2 text-sm text-emerald-100 hover:bg-white/10 transition-colors"
            >
              🏅 Daily Challenge
            </a>
          </div>

          {/* Sign Out */}
          <div className="border-t border-emerald-500/20 px-4 py-3">
            <Button
              onClick={handleSignOut}
              disabled={isLoggingOut}
              variant="outline"
              className="w-full bg-red-600/10 border-red-500/30 text-red-200 hover:bg-red-600/20 hover:text-red-100"
            >
              {isLoggingOut ? "Signing out..." : "🚪 Sign Out"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
