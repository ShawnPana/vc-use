import { motion } from "framer-motion";

export function BackgroundCircles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large central circle */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className="h-[600px] w-[600px] rounded-full border border-neutral-200/20 dark:border-neutral-800/20" />
      </motion.div>

      {/* Medium circle */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      >
        <div className="h-[800px] w-[800px] rounded-full border border-neutral-200/10 dark:border-neutral-800/10" />
      </motion.div>

      {/* Large outer circle */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
      >
        <div className="h-[1000px] w-[1000px] rounded-full border border-neutral-200/5 dark:border-neutral-800/5" />
      </motion.div>

      {/* Animated rotating circle */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-[700px] w-[700px] rounded-full border border-neutral-200/5 dark:border-neutral-800/5 border-dashed" />
      </motion.div>
    </div>
  );
}
