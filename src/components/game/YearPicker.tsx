import { Slider } from "@/components/ui/slider";
import { ValidationConstants } from "@/types";

interface YearPickerProps {
	selectedYear: number | null;
	onYearChange: (year: number) => void;
	disabled?: boolean;
}

export function YearPicker({ selectedYear, onYearChange, disabled = false }: YearPickerProps) {
	const { MIN, MAX } = ValidationConstants.YEAR;

	const handleSliderChange = (values: number[]) => {
		const year = values[0];
		onYearChange(year);
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
			<div className="text-center">
				<div className="text-5xl font-bold text-blue-600 dark:text-blue-400" aria-live="polite">
					{selectedYear !== null ? selectedYear : MIN}
				</div>
			</div>

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

			{/* Guidelines */}
			<p className="text-xs text-gray-500 dark:text-gray-400 text-center">
				Use the slider to select a year
			</p>
		</div>
	);
}
