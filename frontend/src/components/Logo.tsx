import lightLogo from "@/assets/logo-light.svg";
import darkLogo from "@/assets/logo-dark.svg";
import { useTheme } from "@/hooks/useTheme";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size, className }: LogoProps) {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? darkLogo : lightLogo;

  return (
    <img
      src={logoSrc}
      alt="VC-Use logo"
      style={size ? { width: size, height: size } : undefined}
      className={className}
    />
  );
}
