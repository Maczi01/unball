import { Input } from "@/components/ui/input";
import { ValidationConstants } from "@/types";

interface NicknameInputProps {
	value: string;
	onChange: (value: string) => void;
	error?: string;
}

export function NicknameInput({ value, onChange, error }: NicknameInputProps) {
	const { MIN_LENGTH, MAX_LENGTH, REGEX } = ValidationConstants.NICKNAME;

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		// Enforce max length
		if (newValue.length <= MAX_LENGTH) {
			onChange(newValue);
		}
	};

	const characterCount = value.length;
	const isNearLimit = characterCount >= MAX_LENGTH - 5;

	return (
		<div className="space-y-3">
			{/* Label */}
			<label htmlFor="nickname-input" className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
				Choose your nickname
			</label>

			{/* Input field */}
			<div className="relative">
				<Input
					id="nickname-input"
					type="text"
					value={value}
					onChange={handleChange}
					placeholder="Enter your nickname..."
					className={`pr-16 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
					aria-invalid={error ? "true" : "false"}
					aria-describedby={error ? "nickname-error" : "nickname-guidelines"}
					maxLength={MAX_LENGTH}
				/>

				{/* Character counter */}
				<div
					className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium tabular-nums ${
						isNearLimit ? "text-yellow-600 dark:text-yellow-400" : "text-gray-500 dark:text-gray-400"
					}`}
					aria-live="polite"
				>
					{characterCount} / {MAX_LENGTH}
				</div>
			</div>

			{/* Error message */}
			{error && (
				<p id="nickname-error" className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2" role="alert">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4 mt-0.5 flex-shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{error}</span>
				</p>
			)}

			{/* Guidelines */}
			<div id="nickname-guidelines" className="space-y-1">
				<p className="text-xs text-gray-600 dark:text-gray-400">Your nickname will be visible on the leaderboard</p>
				<ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1 list-disc list-inside">
					<li>
						{MIN_LENGTH}-{MAX_LENGTH} characters
					</li>
					<li>Letters, numbers, spaces, hyphens (-) and underscores (_) allowed</li>
					<li>Use appropriate language</li>
				</ul>
			</div>
		</div>
	);
}
