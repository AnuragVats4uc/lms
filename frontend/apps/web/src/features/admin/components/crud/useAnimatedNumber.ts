"use client";

import { useEffect, useState } from "react";

export const useAnimatedNumber = (value: number, isEnabled: boolean) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isEnabled) return;

    let frame = 0;
    const frames = 18;
    const interval = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / frames, 1);
      setDisplayValue(Math.round(value * progress));
      if (progress >= 1) window.clearInterval(interval);
    }, 18);

    return () => window.clearInterval(interval);
  }, [isEnabled, value]);

  return isEnabled ? displayValue : value;
};
