import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ValidationConstants } from "@/types";

interface YearPickerProps {
	selectedYear: number | null;
	onYearChange: (year: number) => void;
	disabled?: boolean;
}

export function YearPicker({ selectedYear, onYearChange, disabled = false }: YearPickerProps) {
	const [inputValue, setInputValue] = useState<string>(selectedYear?.toString() || "");
	const [error, setError] = useState<string | null>(null);

	const { MIN, MAX } = ValidationConstants.YEAR;

	// Sync input value with selected year
	useEffect(() => {
		if (selectedYear !== null) {
			setInputValue(selectedYear.toString());
			setError(null);
		}
	}, [selectedYear]);

	const validateAndSetYear = (year: number) => {
		if (!Number.isInteger(year)) {
			setError("Year must be a whole number");
			return false;
		}

		if (year < MIN || year > MAX) {
			setError(`Year must be between ${MIN} and ${MAX}`);
			return false;
		}

		setError(null);
		onYearChange(year);
		return true;
	};

	const handleSliderChange = (values: number[]) => {
		const year = values[0];
		validateAndSetYear(year);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);

		// Allow empty input
		if (value === "") {
			setError(null);
			return;
		}

		// Parse and validate
		const year = parseInt(value, 10);
		if (isNaN(year)) {
			setError("Please enter a valid year");
			return;
		}

		validateAndSetYear(year);
	};

	const handleInputBlur = () => {
		// On blur, if input is empty or invalid, reset to selected year
		if (inputValue === "" || error) {
			if (selectedYear !== null) {
				setInputValue(selectedYear.toString());
				setError(null);
			} else {
				setInputValue("");
			}
		}
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<label className="text-lg font-semibold text-gray-900 dark:text-gray-100">
					What year was this?
				</label>
				<span className="text-sm text-gray-500 dark:text-gray-400">
					{MIN} - {MAX}
				</span>
			</div>

			{/* Selected year display */}
			{selectedYear !== null && (
				<div className="text-center">
					<div className="text-5xl font-bold text-blue-600 dark:text-blue-400" aria-live="polite">
						{selectedYear}
					</div>
				</div>
			)}

			{/* Slider */}
			<div className="px-2">
				<Slider
					min={MIN}
					max={MAX}
					step={1}
					value={[selectedYear || MIN]}
					onValueChange={handleSliderChange}
					disabled={disabled}
					className="w-full"
					aria-label="Year slider"
				/>
			</div>

			{/* Numeric input */}
			<div className="space-y-2">
				<label htmlFor="year-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
					Or enter year directly:
				</label>
				<Input
					id="year-input"
					type="number"
					min={MIN}
					max={MAX}
					value={inputValue}
					onChange={handleInputChange}
					onBlur={handleInputBlur}
					disabled={disabled}
					placeholder={`Enter year (${MIN}-${MAX})`}
					className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
					aria-invalid={error ? "true" : "false"}
					aria-describedby={error ? "year-error" : undefined}
				/>
				{error && (
					<p id="year-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
						{error}
					</p>
				)}
			</div>

			{/* Guidelines */}
			<p className="text-xs text-gray-500 dark:text-gray-400 text-center">
				Use the slider for quick selection or type a specific year
			</p>
		</div>
	);
}
