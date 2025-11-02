import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResendConfirmation() {
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to resend email" });
        return;
      }

      setMessage({ type: "success", text: "Confirmation email sent! Check your inbox." });
      setEmail("");
      setTimeout(() => setIsOpen(false), 3000);
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-emerald-300 hover:text-emerald-200 underline transition-colors"
      >
        Resend confirmation email
      </button>
    );
  }

  return (
    <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-4 mt-4">
      <h3 className="font-semibold text-emerald-200 mb-3">Resend Confirmation Email</h3>
      <form onSubmit={handleResend} className="space-y-3">
        {message && (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              message.type === "success"
                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/50 bg-red-500/10 text-red-200"
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="resend-email" className="text-sm font-medium text-emerald-100">
            Email Address
          </label>
          <Input
            id="resend-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-emerald-300 focus-visible:ring-emerald-300/50"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
          <Button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setMessage(null);
              setEmail("");
            }}
            variant="outline"
            className="border-white/20 text-emerald-100 hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
