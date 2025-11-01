import { useState, useEffect } from "react";

const DEVICE_TOKEN_KEY = "anon_device_token";

/**
 * Custom hook for managing anonymous device token
 * Stores token in localStorage for Daily mode submissions
 */
export function useDeviceToken() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);

  useEffect(() => {
    // Check if localStorage is available
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      setIsStorageAvailable(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("localStorage is not available:", error);
      setIsStorageAvailable(false);
      return;
    }

    // Try to get existing token
    try {
      const existingToken = localStorage.getItem(DEVICE_TOKEN_KEY);
      if (existingToken) {
        setDeviceToken(existingToken);
      } else {
        // Generate new token if not exists
        const newToken = generateToken();
        setDeviceToken(newToken);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to access localStorage:", error);
      setIsStorageAvailable(false);
    }
  }, []);

  const generateToken = () => {
    try {
      // Use crypto.randomUUID if available
      const token = crypto.randomUUID();
      localStorage.setItem(DEVICE_TOKEN_KEY, token);
      return token;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to generate device token:", error);
      // Fallback to manual UUID generation
      const fallbackToken = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      try {
        localStorage.setItem(DEVICE_TOKEN_KEY, fallbackToken);
      } catch (storageError) {
        // eslint-disable-next-line no-console
        console.error("Failed to store device token:", storageError);
      }
      return fallbackToken;
    }
  };

  return {
    deviceToken,
    generateToken,
    isStorageAvailable,
  };
}
