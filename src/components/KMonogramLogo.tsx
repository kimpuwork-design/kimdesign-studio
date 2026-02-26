export function KMonogramLogo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="120" height="120" rx="24" fill="hsl(var(--primary))" />
      <path
        d="M38 30V90M38 60L72 30M54 52L80 90"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
