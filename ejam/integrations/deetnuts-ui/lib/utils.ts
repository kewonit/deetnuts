import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge-ejam";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
