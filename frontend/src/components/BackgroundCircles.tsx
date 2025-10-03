import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

export function BackgroundCircles() {
  const { theme } = useTheme();

  // Define colors based on theme
  const borderColor = theme === "dark" ? "#262626" : "#e5e5e5";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Small inner circle */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: "-200px",
          marginTop: "-200px",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div
          style={{
            height: "400px",
            width: "400px",
            borderRadius: "50%",
            border: `1px solid ${borderColor}`,
          }}
        />
      </motion.div>

      {/* Medium circle */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: "-350px",
          marginTop: "-350px",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      >
        <div
          style={{
            height: "700px",
            width: "700px",
            borderRadius: "50%",
            border: `1px solid ${borderColor}`,
            opacity: 0.5,
          }}
        />
      </motion.div>

      {/* Large circle */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: "-500px",
          marginTop: "-500px",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
      >
        <div
          style={{
            height: "1000px",
            width: "1000px",
            borderRadius: "50%",
            border: `1px solid ${borderColor}`,
            opacity: 0.3,
          }}
        />
      </motion.div>

      {/* Animated rotating dashed circle */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: "-425px",
          marginTop: "-425px",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <div
          style={{
            height: "850px",
            width: "850px",
            borderRadius: "50%",
            border: `1px dashed ${borderColor}`,
            opacity: 0.2,
          }}
        />
      </motion.div>
    </div>
  );
}
