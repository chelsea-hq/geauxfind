type VerifiedBadgeProps = {
  size?: "sm" | "md";
  className?: string;
};

export function VerifiedBadge({ size = "md", className = "" }: VerifiedBadgeProps) {
  const icon = (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={size === "sm" ? "h-4 w-4" : "h-4 w-4"}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" fill="var(--moss)" fillOpacity="0.15" />
      <path d="M6.5 10.2L8.8 12.5L13.5 7.8" stroke="var(--moss)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  if (size === "sm") {
    return <span className={`inline-flex items-center ${className}`}>{icon}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-[var(--moss)]/10 px-2 py-1 text-xs font-medium text-[var(--moss)] ${className}`}>
      {icon}
      <span>GeauxFind Verified</span>
    </span>
  );
}
