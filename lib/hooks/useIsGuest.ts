"use client";

import { useState, useEffect } from "react";

export function useIsGuest(): boolean {
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    setIsGuest(localStorage.getItem("guest_mode") === "true");
  }, []);

  return isGuest;
}
