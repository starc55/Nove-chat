import { useCallback, useEffect, useRef, useState } from "react";

export function useHorizontalScroller(contentKey = 0) {
  const ref = useRef(null);
  const [state, setState] = useState({ canPrev: false, canNext: false });

  const update = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const max = Math.max(0, node.scrollWidth - node.clientWidth);
    const next = { canPrev: node.scrollLeft > 4, canNext: node.scrollLeft < max - 4 };
    setState((current) => current.canPrev === next.canPrev && current.canNext === next.canNext ? current : next);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    node.addEventListener("scroll", update, { passive: true });
    return () => { observer.disconnect(); node.removeEventListener("scroll", update); };
  }, [contentKey, update]);

  const scroll = useCallback((direction) => {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * .82), behavior: "smooth" });
  }, []);

  return { ref, scroll, ...state };
}
