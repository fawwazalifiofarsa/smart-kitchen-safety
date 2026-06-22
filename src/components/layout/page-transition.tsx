"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{
            opacity: 0,
            y: 10,
            scale: 0.992,
            filter: "blur(3px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          }}
          exit={{
            opacity: 0,
            y: -8,
            scale: 0.996,
            filter: "blur(2px)",
          }}
          transition={{
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="min-h-screen will-change-transform"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <motion.div
        key={`route-sweep-${pathname}`}
        initial={{
          opacity: 0,
          scaleX: 0,
          transformOrigin: "left",
        }}
        animate={{
          opacity: [0, 0.18, 0],
          scaleX: [0, 1, 1],
        }}
        transition={{
          duration: 0.75,
          times: [0, 0.45, 1],
          ease: [0.16, 1, 0.3, 1],
        }}
        className="pointer-events-none fixed inset-0 z-[9999] bg-[linear-gradient(90deg,transparent_0%,rgba(14,165,233,0.18)_45%,rgba(20,184,166,0.22)_55%,transparent_100%)] will-change-transform"
      />
    </>
  );
}
