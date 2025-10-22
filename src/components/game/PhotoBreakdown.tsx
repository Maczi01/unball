import { useState } from "react";
import type { PhotoScoreResultDTO } from "@/types";

interface PhotoBreakdownProps {
	result: PhotoScoreResultDTO;
	index: number; // 0-4
}

export function PhotoBreakdown({ result, index }: PhotoBreakdownProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const photoNumber = index + 1;
	const percentage = (result.total_score / 20000) * 100;

	// Determine color based on score percentage
	const getScoreColor = () => {
		if (percentage >= 80) return "text-green-600 dark:text-green-400";
		if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
		return "text-red-600 dark:text-red-400";
	};

	const getBarColor = () => {
		if (percentage >= 80) return "bg-green-500";
		if (percentage >= 50) return "bg-yellow-500";
		return "bg-red-500";
	};

	return (
		<div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
			{/* Main row */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full p-4 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
				aria-expanded={isExpanded}
				aria-controls={`photo-details-${index}`}
			>
				{/* Photo number badge */}
				<div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
					{photoNumber}
				</div>

				{/* Event name and details */}
				<div className="flex-1 text-left min-w-0">
					<h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{result.event_name}</h4>
					<div className="flex items-center gap-3 mt-1">
						<span className="text-xs text-gray-500 dark:text-gray-400">
							{result.km_error.toFixed(1)} km • {result.year_error} {result.year_error === 1 ? "year" : "years"}
						</span>
					</div>
				</div>

				{/* Score */}
				<div className="flex-shrink-0 text-right">
					<div className={`text-xl font-bold tabular-nums ${getScoreColor()}`}>
						{result.total_score.toLocaleString()}
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400">{percentage.toFixed(0)}%</p>
				</div>

				{/* Expand icon */}
				<div className="flex-shrink-0">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</div>
			</button>

			{/* Expanded details */}
			{isExpanded && (
				<div id={`photo-details-${index}`} className="px-4 pb-4 space-y-3 animate-in slide-in-from-top duration-200">
					{/* Score breakdown bars */}
					<div className="space-y-3">
						{/* Location score */}
						<div className="space-y-1">
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">Location</span>
								<span className="font-semibold text-gray-900 dark:text-gray-100">
									{result.location_score.toLocaleString()} / 10,000
								</span>
							</div>
							<div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div
									className={`h-full ${getBarColor()} transition-all`}
									style={{ width: `${(result.location_score / 10000) * 100}%` }}
								/>
							</div>
						</div>

						{/* Time score */}
						<div className="space-y-1">
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600 dark:text-gray-400">Time</span>
								<span className="font-semibold text-gray-900 dark:text-gray-100">
									{result.time_score.toLocaleString()} / 10,000
								</span>
							</div>
							<div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div
									className={`h-full ${getBarColor()} transition-all`}
									style={{ width: `${(result.time_score / 10000) * 100}%` }}
								/>
							</div>
						</div>
					</div>

					{/* Correct answer */}
					<div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
						<p>
							Correct: {result.correct_year} • {result.correct_lat.toFixed(2)}°, {result.correct_lon.toFixed(2)}°
						</p>
					</div>

					{/* Description */}
					{result.description && (
						<div className="text-sm text-gray-600 dark:text-gray-400">
							<p>{result.description}</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
