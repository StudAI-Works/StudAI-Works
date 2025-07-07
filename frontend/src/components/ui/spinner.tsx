import { Loader2 } from "lucide-react";
// Make sure you have this utility file from shadcn
import { cn } from "@/lib/utils"; 

export const Spinner = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-16 w-16",
  };

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
  );
};