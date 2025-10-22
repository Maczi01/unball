import { useEffect, useState } from "react";
import type { PhotoScoreResultDTO } from "@/types";

interface ScoreCardProps {
	result: PhotoScoreResultDTO;
	animate?: boolean;
}

export function ScoreCard({ result, animate = true }: ScoreCardProps) {
	const [displayLocationScore, setDisplayLocationScore] = useState(0);
	const [displayTimeScore, setDisplayTimeScore] = useState(0);

	// Animate score counting
	useEffect(() => {
		if (!animate) {
			setDisplayLocationScore(result.location_score);
			setDisplayTimeScore(result.time_score);
			return;
		}

		const duration = 1500; // 1.5 seconds
		const steps = 60;
		const stepDuration = duration / steps;

		let currentStep = 0;

		const interval = setInterval(() => {
			currentStep++;
			const progress = currentStep / steps;

			setDisplayLocationScore(Math.round(result.location_score * progress));
			setDisplayTimeScore(Math.round(result.time_score * progress));

			if (currentStep >= steps) {
				clearInterval(interval);
				setDisplayLocationScore(result.location_score);
				setDisplayTimeScore(result.time_score);
			}
		}, stepDuration);

		return () => clearInterval(interval);
	}, [result.location_score, result.time_score, animate]);

	const totalScore = displayLocationScore + displayTimeScore;
	const maxScore = 20000;

	// Calculate score color based on percentage
	const getScoreColor = (score: number, max: number) => {
		const percentage = (score / max) * 100;
		if (percentage >= 80) return "text-green-600 dark:text-green-400";
		if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
		return "text-red-600 dark:text-red-400";
	};

	const formatNumber = (num: number) => num.toLocaleString();

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
			{/* Event details */}
			<div className="space-y-2">
				<h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{result.event_name}</h3>
				{result.description && (
					<p className="text-sm text-gray-600 dark:text-gray-400">{result.description}</p>
				)}
			</div>

			{/* Score breakdown */}
			<div className="space-y-4">
				{/* Location score */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</span>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							{result.km_error.toFixed(1)} km away
						</span>
					</div>
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div
									className="h-full bg-blue-500 transition-all duration-500 ease-out"
									style={{ width: `${(displayLocationScore / 10000) * 100}%` }}
									role="progressbar"
									aria-valuenow={displayLocationScore}
									aria-valuemin={0}
									aria-valuemax={10000}
								/>
							</div>
							<span className={`ml-3 text-lg font-bold tabular-nums ${getScoreColor(result.location_score, 10000)}`}>
								{formatNumber(displayLocationScore)}
							</span>
						</div>
						<p className="text-xs text-gray-500 dark:text-gray-400">out of 10,000</p>
					</div>
				</div>

				{/* Time score */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</span>
						<span className="text-xs text-gray-500 dark:text-gray-400">
							{result.year_error} {result.year_error === 1 ? "year" : "years"} off
						</span>
					</div>
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
								<div
									className="h-full bg-purple-500 transition-all duration-500 ease-out"
									style={{ width: `${(displayTimeScore / 10000) * 100}%` }}
									role="progressbar"
									aria-valuenow={displayTimeScore}
									aria-valuemin={0}
									aria-valuemax={10000}
								/>
							</div>
							<span className={`ml-3 text-lg font-bold tabular-nums ${getScoreColor(result.time_score, 10000)}`}>
								{formatNumber(displayTimeScore)}
							</span>
						</div>
						<p className="text-xs text-gray-500 dark:text-gray-400">out of 10,000</p>
					</div>
				</div>

				{/* Divider */}
				<div className="border-t border-gray-200 dark:border-gray-700 pt-4">
					{/* Total score */}
					<div className="flex items-center justify-between">
						<span className="text-lg font-bold text-gray-900 dark:text-gray-100">Total</span>
						<div className="text-right">
							<div className={`text-2xl font-bold tabular-nums ${getScoreColor(totalScore, maxScore)}`}>
								{formatNumber(totalScore)}
							</div>
							<p className="text-xs text-gray-500 dark:text-gray-400">out of {formatNumber(maxScore)}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Photo credits */}
			{(result.credit || result.source_url) && (
				<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
					<p className="text-xs text-gray-500 dark:text-gray-400">
						{result.credit && <span>Photo: {result.credit}</span>}
						{result.credit && result.source_url && <span> • </span>}
						{result.source_url && (
							<a
								href={result.source_url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 dark:text-blue-400 hover:underline"
							>
								Source
							</a>
						)}
						{result.license && <span> • License: {result.license}</span>}
					</p>
				</div>
			)}
		</div>
	);
}
