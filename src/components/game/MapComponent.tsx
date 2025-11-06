import { useEffect, useRef, useState, memo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PinLocation } from "@/types";

mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapComponentProps {
  userPin: PinLocation | null;
  correctPin: PinLocation | null; // Only during feedback
  showFeedback: boolean;
  kmError: number | null; // Distance for feedback
  onPinPlace: (lat: number, lon: number) => void;
  onPinMove: (lat: number, lon: number) => void;
  className?: string;
}

const MapComponentInner = ({
  userPin,
  correctPin,
  showFeedback,
  kmError,
  onPinPlace,
  onPinMove,
  className = "",
}: MapComponentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const correctMarker = useRef<mapboxgl.Marker | null>(null);
  const distanceMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [0, 20], // Center on world view
        zoom: 1.5,
        attributionControl: true,
      });

      map.current.on("load", () => {
        setMapLoaded(true);
      });

      map.current.on("error", (e) => {
        // eslint-disable-next-line no-console
        console.error("Mapbox error:", e);
        setMapError("Failed to load map. Please check your connection.");
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
        }),
        "top-right"
      );

      // Handle map clicks for pin placement (when not in feedback mode)
      map.current.on("click", (e) => {
        if (!showFeedback) {
          onPinPlace(e.lngLat.lat, e.lngLat.lng);
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize map:", error);
      setMapError("Failed to initialize map. Please refresh the page.");
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onPinPlace, showFeedback]);

  // Update user pin marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing marker
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Add new marker if pin exists
    if (userPin) {
      const el = document.createElement("div");
      el.className = "w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg cursor-move";
      el.setAttribute("aria-label", "Your guess location");

      userMarker.current = new mapboxgl.Marker({
        element: el,
        draggable: !showFeedback, // Only draggable when not in feedback mode
      })
        .setLngLat([userPin.lon, userPin.lat])
        .addTo(map.current);

      // Handle drag events
      if (!showFeedback) {
        userMarker.current.on("dragend", () => {
          const lngLat = userMarker.current?.getLngLat();
          if (lngLat) {
            onPinMove(lngLat.lat, lngLat.lng);
          }
        });
      }
    }
  }, [userPin, mapLoaded, showFeedback, onPinMove]);

  // Update correct pin marker (feedback mode)
  useEffect(() => {
    if (!map.current || !mapLoaded || !showFeedback) {
      // Remove distance marker when not in feedback mode
      if (distanceMarker.current) {
        distanceMarker.current.remove();
        distanceMarker.current = null;
      }
      return;
    }

    // Remove existing marker
    if (correctMarker.current) {
      correctMarker.current.remove();
    }

    // Add correct pin marker
    if (correctPin) {
      const el = document.createElement("div");
      el.className = "w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg";
      el.setAttribute("aria-label", "Correct location");

      correctMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([correctPin.lon, correctPin.lat])
        .addTo(map.current);
    }

    // Draw line between pins if both exist
    if (userPin && correctPin && map.current && kmError !== null) {
      const sourceId = "line-source";
      const layerId = "line-layer";

      // Remove existing line
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }

      // Add line
      map.current.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [userPin.lon, userPin.lat],
              [correctPin.lon, correctPin.lat],
            ],
          },
        },
      });

      map.current.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        layout: {},
        paint: {
          "line-color": "#ef4444",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });

      // Calculate midpoint for distance label
      const midLon = (userPin.lon + correctPin.lon) / 2;
      const midLat = (userPin.lat + correctPin.lat) / 2;

      // Remove existing distance marker
      if (distanceMarker.current) {
        distanceMarker.current.remove();
      }

      // Create distance label element
      const distanceEl = document.createElement("div");
      distanceEl.className = "px-3 py-1.5 bg-white dark:bg-gray-800 rounded-md shadow-lg border-2 border-red-500 dark:border-red-400 text-sm font-semibold whitespace-nowrap";
      distanceEl.innerHTML = `<span class="text-red-600 dark:text-red-400">${kmError.toFixed(1)} km</span>`;
      distanceEl.setAttribute("aria-label", `Distance: ${kmError.toFixed(1)} kilometers`);

      // Add distance marker at midpoint
      distanceMarker.current = new mapboxgl.Marker({
        element: distanceEl,
        anchor: "center",
      })
        .setLngLat([midLon, midLat])
        .addTo(map.current);

      // Fit bounds to show both pins
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([userPin.lon, userPin.lat]);
      bounds.extend([correctPin.lon, correctPin.lat]);

      map.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 10,
      });
    }
  }, [correctPin, showFeedback, userPin, mapLoaded, kmError]);

  const handleResetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: [0, 20],
        zoom: 1.5,
        duration: 1000,
      });
    }
  };

  if (mapError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center p-8">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg overflow-hidden z-40"
        role="application"
        aria-label="Interactive world map for guessing photo locations"
      />

      {/* Reset view button */}
      {!showFeedback && (
        <button
          onClick={handleResetView}
          className="absolute bottom-4 left-4 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow text-sm font-medium border border-gray-200 dark:border-gray-700"
          aria-label="Reset map view"
        >
          Reset View
        </button>
      )}

      {/* Distance label in feedback mode */}
      {showFeedback && kmError !== null && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold">
            Distance: <span className="text-red-600 dark:text-red-400">{kmError.toFixed(1)} km</span>
          </p>
        </div>
      )}

      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Keyboard navigation instructions */}
      <div className="sr-only" role="status" aria-live="polite">
        {!showFeedback && "Click on the map to place your guess pin. You can drag the pin to adjust your guess."}
        {showFeedback && "Viewing feedback: blue pin shows your guess, green pin shows the correct location."}
      </div>
    </div>
  );
};

export const MapComponent = memo(MapComponentInner);
