"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  /* Force Light Mode - Tally Prime Style */
  const [theme] = useState("light"); // Always light
  
  useEffect(() => {
    // Always enforce light mode by removing 'dark' class
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
    localStorage.setItem("gks-theme", "light");
  }, []);

  const toggleTheme = () => {
    // Theme is locked to light mode (Tally Prime Style) — no-op
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
