import { useEffect } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

export function LanguageMotion({ language, children }) {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    void controls.start({
      opacity: [0.82, 1],
      y: [5, 0],
      filter: ["blur(2px)", "blur(0px)"],
      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
    });
  }, [controls, language, reduceMotion]);

  return <motion.div animate={controls}>{children}</motion.div>;
}
