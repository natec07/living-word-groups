import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Edge-to-edge horizontal scroll rail (Netflix/app-store style), bleeding
// past the page's own padding so cards touch the screen edge on mobile.
export const RAIL_CLASS =
  "-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
