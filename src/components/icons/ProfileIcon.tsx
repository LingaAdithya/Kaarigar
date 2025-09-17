import type { SVGProps } from "react";

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="7" r="3" />
      <path d="M12 10v7" />
      <path d="M9 20h6" />
      <path d="M12 17l-3 3" />
      <path d="M12 17l3 3" />
      <path d="M9 14h6" />
    </svg>
  );
}
