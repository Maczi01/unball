import { useState, useEffect } from "react";
import type { GameMode, SubmissionCheckResponseDTO } from "@/types";

/**
 * Custom hook for checking if user has already submitted today's Daily challenge
 * Only runs in Daily mode
 */
export function useSubmissionCheck(mode: GameMode, deviceToken: string | null) {
	const [hasSubmitted, setHasSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const checkSubmission = async () => {
		// Only check in Daily mode with a valid device token
		if (mode !== "daily" || !deviceToken) {
			setHasSubmitted(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/daily/submissions/check", {
				headers: {
					"X-Device-Token": deviceToken,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to check submission: ${response.statusText}`);
			}

			const data: SubmissionCheckResponseDTO = await response.json();
			setHasSubmitted(data.has_submitted);
		} catch (err) {
			console.error("Submission check error:", err);
			setError(err instanceof Error ? err : new Error("Unknown error"));
			// Assume not submitted if check fails (allow gameplay)
			setHasSubmitted(false);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		checkSubmission();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode, deviceToken]);

	return {
		hasSubmitted,
		checkSubmission,
		isLoading,
		error,
	};
}
