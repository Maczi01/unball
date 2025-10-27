import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ValidationConstants } from "@/types";

type LocationPickerProps = {
  lat: string;
  lon: string;
  onChange: (location: { lat: string; lon: string }) => void;
  error?: string;
  disabled?: boolean;
};

export function LocationPicker({
  lat,
  lon,
  onChange,
  error,
  disabled = false,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if mapbox token is available
    const token = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setMapError("Mapbox token not configured. Please enter coordinates manually.");
      return;
    }

    mapboxgl.accessToken = token;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [0, 20], // Default center
        zoom: 1.5,
      });

      mapRef.current = map;

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Handle map clicks
      map.on("click", (e) => {
        if (disabled) return;

        const { lng, lat } = e.lngLat;
        updatePin(lng, lat);
        onChange({
          lat: lat.toFixed(6),
          lon: lng.toFixed(6),
        });
      });

      return () => {
        map.remove();
      };
    } catch (err) {
      setMapError("Failed to load map. Please enter coordinates manually.");
      console.error("Map initialization error:", err);
    }
  }, [disabled, onChange]);

  // Update pin position when lat/lon props change
  useEffect(() => {
    if (!mapRef.current) return;

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (!isNaN(latNum) && !isNaN(lonNum)) {
      updatePin(lonNum, latNum);
      mapRef.current.flyTo({
        center: [lonNum, latNum],
        zoom: 8,
      });
    }
  }, [lat, lon]);

  const updatePin = useCallback((lng: number, lat: number) => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create new marker
    const marker = new mapboxgl.Marker({
      draggable: !disabled,
      color: "#ef4444", // red-500
    })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    // Handle marker drag
    if (!disabled) {
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onChange({
          lat: lngLat.lat.toFixed(6),
          lon: lngLat.lng.toFixed(6),
        });
      });
    }

    markerRef.current = marker;
  }, [disabled, onChange]);

  const handleLatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange({ lat: value, lon });
    },
    [lon, onChange]
  );

  const handleLonChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange({ lat, lon: value });
    },
    [lat, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="map-container">Location on Map</Label>
        {mapError ? (
          <div
            className="w-full h-[400px] flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900/50"
            role="alert"
          >
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center px-4">
              {mapError}
            </p>
          </div>
        ) : (
          <>
            <div
              ref={mapContainerRef}
              id="map-container"
              className={cn(
                "w-full h-[400px] rounded-lg border border-neutral-200 dark:border-neutral-800",
                disabled && "opacity-50 pointer-events-none"
              )}
              aria-label="Interactive map for location selection"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Click on the map to select the event location or enter coordinates manually below
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">
            Latitude <span className="text-red-500">*</span>
          </Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            min={ValidationConstants.COORDINATES.LAT_MIN}
            max={ValidationConstants.COORDINATES.LAT_MAX}
            value={lat}
            onChange={handleLatChange}
            disabled={disabled}
            placeholder="e.g., 51.5074"
            className={cn(error && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!error}
            aria-describedby={error ? "location-error" : undefined}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Range: {ValidationConstants.COORDINATES.LAT_MIN} to{" "}
            {ValidationConstants.COORDINATES.LAT_MAX}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">
            Longitude <span className="text-red-500">*</span>
          </Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            min={ValidationConstants.COORDINATES.LON_MIN}
            max={ValidationConstants.COORDINATES.LON_MAX}
            value={lon}
            onChange={handleLonChange}
            disabled={disabled}
            placeholder="e.g., -0.1278"
            className={cn(error && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!error}
            aria-describedby={error ? "location-error" : undefined}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Range: {ValidationConstants.COORDINATES.LON_MIN} to{" "}
            {ValidationConstants.COORDINATES.LON_MAX}
          </p>
        </div>
      </div>

      {error && (
        <p id="location-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
