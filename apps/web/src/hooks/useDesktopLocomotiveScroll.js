import { useEffect, useRef } from "react";

const DESKTOP_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

export function useDesktopLocomotiveScroll(refreshKey) {
  const instanceRef = useRef(null);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;

    const destroy = () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      document.documentElement.classList.remove("desktop-smooth-scroll");
    };

    const setup = async () => {
      if (!desktop.matches || reducedMotion.matches || instanceRef.current) return;
      const [{ default: LocomotiveScroll }] = await Promise.all([
        import("locomotive-scroll"),
        import("locomotive-scroll/locomotive-scroll.css")
      ]);
      if (cancelled || !desktop.matches || reducedMotion.matches) return;
      instanceRef.current = new LocomotiveScroll({
        lenisOptions: {
          smoothWheel: true,
          lerp: 0.075,
          wheelMultiplier: 0.85,
          anchors: { offset: -110 },
          allowNestedScroll: true
        }
      });
      document.documentElement.classList.add("desktop-smooth-scroll");
    };

    const reconcile = () => {
      destroy();
      void setup();
    };
    void setup();
    desktop.addEventListener("change", reconcile);
    reducedMotion.addEventListener("change", reconcile);
    return () => {
      cancelled = true;
      desktop.removeEventListener("change", reconcile);
      reducedMotion.removeEventListener("change", reconcile);
      destroy();
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => instanceRef.current?.resize());
    return () => window.cancelAnimationFrame(frame);
  }, [refreshKey]);
}
