import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to clean code blocks in strings (Socratic filter simulation)
export function stripCodeBlocks(text: string): string {
  // Regex to remove markdown code blocks
  return text.replace(/```[\s\S]*?```/g, "[Code snippet removed by Socratic Mentor]");
}

// Utility to format task and project completion percentages
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
