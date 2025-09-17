import type { SVGProps } from "react";

export function KolamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" {...props}>
      <path d="M12 2L12 5" />
      <path d="M12 19L12 22" />
      <path d="M22 12L19 12" />
      <path d="M5 12L2 12" />
      <path d="M19.07 4.93L17 7" />
      <path d="M7 17L4.93 19.07" />
      <path d="M19.07 19.07L17 17" />
      <path d="M7 7L4.93 4.93" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
