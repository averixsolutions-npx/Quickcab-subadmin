import Image from "next/image";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = name ? getInitials(name) : "?";

  if (src) {
    return (
      <div className={cn("relative rounded-full overflow-hidden bg-brand-purple-muted shrink-0", sizeClasses[size], className)}>
        <Image src={src} alt={name ?? "Avatar"} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-brand-purple flex items-center justify-center shrink-0 font-semibold text-white",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
