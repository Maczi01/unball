import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ValidationConstants } from "@/types";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation (basic)
    if (!email.includes("@")) {
      errors.email = "Invalid email address";
    }

    // Password validation
    if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Nickname validation (optional but if provided must be valid)
    if (nickname) {
      if (nickname.length < ValidationConstants.NICKNAME.MIN_LENGTH) {
        errors.nickname = `Nickname must be at least ${ValidationConstants.NICKNAME.MIN_LENGTH} characters`;
      }
      if (nickname.length > ValidationConstants.NICKNAME.MAX_LENGTH) {
        errors.nickname = `Nickname must be no more than ${ValidationConstants.NICKNAME.MAX_LENGTH} characters`;
      }
      if (!ValidationConstants.NICKNAME.REGEX.test(nickname)) {
        errors.nickname = "Nickname can only contain letters, numbers, spaces, hyphens, and underscores";
      }
      // TODO: Add profanity check when backend is implemented
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: API endpoint needs to be implemented
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nickname: nickname || undefined, // Send only if provided
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      // Success - redirect to home
      window.location.href = "/";
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded-md border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-emerald-100">
          Email <span className="text-red-300">*</span>
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-emerald-300 focus-visible:ring-emerald-300/50"
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-red-300">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Nickname Field (Optional) */}
      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-medium text-emerald-100">
          Nickname <span className="text-emerald-200/60 text-xs font-normal">(optional)</span>
        </label>
        <Input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="FootyFan123"
          maxLength={ValidationConstants.NICKNAME.MAX_LENGTH}
          disabled={isLoading}
          aria-invalid={!!fieldErrors.nickname}
          aria-describedby={fieldErrors.nickname ? "nickname-error" : "nickname-help"}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-emerald-300 focus-visible:ring-emerald-300/50"
        />
        {fieldErrors.nickname ? (
          <p id="nickname-error" className="text-sm text-red-300">
            {fieldErrors.nickname}
          </p>
        ) : (
          <p id="nickname-help" className="text-xs text-emerald-100/60">
            3-20 characters, letters, numbers, spaces, hyphens, underscores
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-emerald-100">
          Password <span className="text-red-300">*</span>
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : "password-help"}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-emerald-300 focus-visible:ring-emerald-300/50"
        />
        {fieldErrors.password ? (
          <p id="password-error" className="text-sm text-red-300">
            {fieldErrors.password}
          </p>
        ) : (
          <p id="password-help" className="text-xs text-emerald-100/60">
            Minimum 8 characters
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-emerald-100">
          Confirm Password <span className="text-red-300">*</span>
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-emerald-300 focus-visible:ring-emerald-300/50"
        />
        {fieldErrors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-red-300">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>

      <p className="text-xs text-emerald-100/60 text-center mt-4">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}
