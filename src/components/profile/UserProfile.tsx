import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  role: "user" | "admin";
  canAddPhotos: boolean;
  createdAt: string;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
      setNickname(data.nickname || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      setError("Nickname cannot be empty");
      return;
    }

    if (nickname.length < 3 || nickname.length > 20) {
      setError("Nickname must be between 3 and 20 characters");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update nickname");
      }

      setSuccessMessage("Nickname updated successfully!");
      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save nickname");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNickname(profile?.nickname || "");
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900">
        <div className="text-emerald-100">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900">
        <Card className="p-8 bg-gradient-to-b from-green-900/95 to-emerald-900/95 border-emerald-500/30">
          <p className="text-red-200">Failed to load profile</p>
          {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-100 mb-2">Profile Settings</h1>
          <p className="text-emerald-200/70">Manage your account information</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
            <p className="text-emerald-100">{successMessage}</p>
          </div>
        )}

        {error && !isEditing && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <Card className="p-6 bg-gradient-to-b from-green-900/95 to-emerald-900/95 backdrop-blur-xl border-emerald-500/30">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-emerald-500/20">
            <div className="size-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {profile.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-100">{profile.nickname || "No nickname set"}</h2>
              <p className="text-emerald-200/70">{profile.email}</p>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-6">
            {/* Nickname */}
            <div>
              <Label htmlFor="nickname" className="text-emerald-100">
                Nickname
              </Label>
              {isEditing ? (
                <div className="mt-2 space-y-3">
                  <Input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-emerald-950/50 border-emerald-500/30 text-emerald-100"
                    placeholder="Enter your nickname"
                    maxLength={20}
                  />
                  {error && <p className="text-sm text-red-300">{error}</p>}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNickname}
                      disabled={isSaving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline" disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-emerald-100 text-lg">{profile.nickname || "Not set"}</p>
                  <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <Label className="text-emerald-100">Role</Label>
              <div className="mt-2">
                <Badge className={profile.role === "admin" ? "bg-purple-600" : "bg-blue-600"}>
                  {profile.role === "admin" ? "Admin" : "User"}
                </Badge>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <Label className="text-emerald-100">Permissions</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`size-2 rounded-full ${profile.canAddPhotos ? "bg-green-500" : "bg-gray-500"}`} />
                  <span className="text-emerald-200/70">
                    {profile.canAddPhotos ? "Can submit photos" : "Cannot submit photos"}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Created */}
            <div>
              <Label className="text-emerald-100">Member Since</Label>
              <p className="mt-2 text-emerald-200/70">{formatDate(profile.createdAt)}</p>
            </div>

            {/* User ID (for reference) */}
            <div>
              <Label className="text-emerald-100">User ID</Label>
              <p className="mt-2 text-emerald-200/70 text-xs font-mono break-all">{profile.id}</p>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <a
            href="/play/normal"
            className="block p-4 rounded-lg border border-emerald-500/30 bg-green-900/50 hover:bg-green-900/70 transition-colors"
          >
            <div className="text-2xl mb-2">🎮</div>
            <div className="text-emerald-100 font-medium">Play Normal Mode</div>
            <div className="text-emerald-200/60 text-sm">Practice unlimited rounds</div>
          </a>
          <a
            href="/play/daily"
            className="block p-4 rounded-lg border border-emerald-500/30 bg-green-900/50 hover:bg-green-900/70 transition-colors"
          >
            <div className="text-2xl mb-2">🏅</div>
            <div className="text-emerald-100 font-medium">Daily Challenge</div>
            <div className="text-emerald-200/60 text-sm">Compete on leaderboard</div>
          </a>
        </div>
      </div>
    </div>
  );
}
