interface TimerProps {
	elapsedMs: number;
}

export function Timer({ elapsedMs }: TimerProps) {
	const formatTime = (milliseconds: number): string => {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;

		return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	const formattedTime = formatTime(elapsedMs);

	return (
		<div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-5 w-5 text-gray-600 dark:text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<span
				className="font-mono text-lg font-semibold tabular-nums"
				role="timer"
				aria-live="polite"
				aria-atomic="true"
				aria-label={`Elapsed time: ${formattedTime}`}
			>
				{formattedTime}
			</span>
		</div>
	);
}
