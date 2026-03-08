
"use client";

import { useEffect } from "react";
import { useTenant } from "@/hooks/use-tenant";

/**
 * Dynamically injects CSS variables based on the company's theme settings.
 */
export function ThemeSync() {
  const { settings } = useTenant();

  useEffect(() => {
    if (!settings?.theme) return;

    const root = document.documentElement;
    const theme = settings.theme;

    if (theme.primary) {
      // We store hex in DB, convert to HSL for Tailwind compatibility
      const hsl = hexToHsl(theme.primary);
      if (hsl) {
        root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }

    if (theme.accent) {
      const hsl = hexToHsl(theme.accent);
      if (hsl) {
        root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }
  }, [settings?.theme]);

  return null;
}

/**
 * Utility to convert Hex to HSL values for Tailwind variable injection
 */
function hexToHsl(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    return null;
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
