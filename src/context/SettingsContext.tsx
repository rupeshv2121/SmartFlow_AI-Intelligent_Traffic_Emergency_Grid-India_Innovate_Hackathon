import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getSystemSettings, type SystemSettings } from "@/lib/settings-api";

type SettingsContextValue = {
  systemSettings: SystemSettings | null;
  setSystemSettings: (s: SystemSettings | null) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      try {
        const res = await getSystemSettings();
        if (res.success && mounted) setSystemSettings(res.data);
      } catch (err) {
        console.error("Failed to load system settings:", err);
      }
    };

    fetchSettings();

    // Connect socket.io to listen for settings updates
    const socket = io();

    socket.on("connect", () => {
      // console.log("Socket connected", socket.id);
    });

    socket.on("settings-updated", (updated: SystemSettings) => {
      setSystemSettings(updated);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ systemSettings, setSystemSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export default SettingsProvider;
