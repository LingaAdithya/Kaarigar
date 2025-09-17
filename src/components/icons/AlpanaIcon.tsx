import type { SVGProps } from "react";

export function AlpanaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" />
      <path d="M12 2C14.7614 2 17 4.23858 17 7C17 9.76142 14.7614 12 12 12C9.23858 12 7 9.76142 7 7C7 4.23858 9.23858 2 12 2Z" />
      <path d="M12 22C9.23858 22 7 19.7614 7 17C7 14.2386 9.23858 12 12 12C14.7614 12 17 14.2386 17 17C17 19.7614 14.7614 22 12 22Z" />
    </svg>
  );
}
