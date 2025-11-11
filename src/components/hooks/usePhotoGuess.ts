import { useState, useMemo, useCallback } from "react";
import type { PinLocation } from "@/types";
import { ValidationConstants } from "@/types";

/**
 * Custom hook for managing current photo guess state
 * Handles pin placement on the map
 */
export function usePhotoGuess() {
  const [pin, setPin] = useState<PinLocation | null>(null);

  const setPinLocation = useCallback((lat: number, lon: number) => {
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
  }, []);

  const clearGuess = useCallback(() => {
    setPin(null);
  }, []);

  const isComplete = useMemo(() => {
    return pin !== null;
  }, [pin]);

  return {
    pin,
    setPin: setPinLocation,
    clearGuess,
    isComplete,
  };
}
