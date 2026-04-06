"use client";

import { useEffect, useRef, useState } from "react";

export default function useAberration({ maxOffset = 9, decay = 150 } = {}) {
  const [aberration, setAberration] = useState(0);
  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());
  const decayRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      const now = Date.now();
      const dt = Math.max(now - lastTime.current, 1);
      const delta = window.scrollY - lastScrollY.current;
      const velocity = delta / dt;
      lastScrollY.current = window.scrollY;
      lastTime.current = now;
      setAberration(Math.max(Math.min(velocity * maxOffset, maxOffset), -maxOffset));
      if (decayRef.current) clearTimeout(decayRef.current);
      decayRef.current = setTimeout(() => setAberration(0), decay);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (decayRef.current) clearTimeout(decayRef.current);
    };
  }, [maxOffset, decay]);

  return aberration;
}
