import { useState, useMemo } from "react";
import type { PinLocation } from "@/types";
import { ValidationConstants } from "@/types";

/**
 * Custom hook for managing current photo guess state
 * Handles pin placement and year selection
 */
export function usePhotoGuess() {
  const [pin, setPin] = useState<PinLocation | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const setPinLocation = (lat: number, lon: number) => {
    // Validate coordinates
    if (
      lat >= ValidationConstants.COORDINATES.LAT_MIN &&
      lat <= ValidationConstants.COORDINATES.LAT_MAX &&
      lon >= ValidationConstants.COORDINATES.LON_MIN &&
      lon <= ValidationConstants.COORDINATES.LON_MAX
    ) {
      setPin({ lat, lon });
    } else {
      // eslint-disable-next-line no-console
      console.error("Invalid coordinates:", { lat, lon });
    }
  };

  const setYearValue = (newYear: number) => {
    // Validate year range
    if (newYear >= ValidationConstants.YEAR.MIN && newYear <= ValidationConstants.YEAR.MAX) {
      setYear(newYear);
    } else {
      // eslint-disable-next-line no-console
      console.error("Invalid year:", newYear);
    }
  };

  const clearGuess = () => {
    setPin(null);
    setYear(null);
  };

  const isComplete = useMemo(() => {
    return pin !== null && year !== null;
  }, [pin, year]);

  return {
    pin,
    year,
    setPin: setPinLocation,
    setYear: setYearValue,
    clearGuess,
    isComplete,
  };
}
