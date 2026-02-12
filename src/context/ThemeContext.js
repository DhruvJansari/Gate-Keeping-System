"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  /* Force Dark Mode */
  const [theme] = useState("dark"); // Always dark
  
  useEffect(() => {
    // Always enforce dark mode
    document.documentElement.classList.add("dark");
    // Optional: remove if you really want to clean up, but adding is enough
    document.documentElement.style.colorScheme = "dark";
    localStorage.setItem("gks-theme", "dark");
  }, []);

  const toggleTheme = () => {
    // No-op or notification
    console.log("Theme is locked to dark mode");
  };

  const setTheme = () => {}; // No-op

  // Return the actual theme value only after mounting
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
