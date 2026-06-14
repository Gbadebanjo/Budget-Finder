/**
 * Minimal stroke-icon set. Inspired by lucide / heroicons but inlined
 * to avoid a runtime dep. Only the ones FinFlow actually uses.
 */
import { cn } from '@/lib/cn'

const PATHS: Record<string, React.ReactNode> = {
  // Navigation / chrome
  search:        <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  plus:          <><path d="M12 5v14M5 12h14" /></>,
  minus:         <path d="M5 12h14" />,
  x:             <><path d="M18 6 6 18M6 6l12 12" /></>,
  check:         <path d="M20 6 9 17l-5-5" />,
  'chevron-down':<path d="m6 9 6 6 6-6" />,
  'chevron-up':  <path d="m18 15-6-6-6 6" />,
  'chevron-right':<path d="m9 6 6 6-6 6" />,
  'chevron-left':<path d="m15 6-6 6 6 6" />,
  'arrow-up':    <><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>,
  'arrow-down':  <><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>,
  'arrow-up-right': <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
  'arrow-down-right':<><path d="m7 7 10 10" /><path d="M17 7v10H7" /></>,
  'more-horizontal': <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,

  // App
  home:          <><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></>,
  wallet:        <><path d="M2 7a3 3 0 0 1 3-3h13v4"/><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 13h3"/></>,
  receipt:       <><path d="M4 3v18l3-2 3 2 3-2 3 2 3-2V3l-3 2-3-2-3 2-3-2-3 2Z"/><path d="M8 10h8M8 14h5"/></>,
  target:        <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>,
  settings:      <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8h0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
  calendar:      <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  repeat:        <><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></>,
  tag:           <><path d="M12.6 2.6 21 11l-9 9-8.4-8.4A2 2 0 0 1 3 10.2V5a2 2 0 0 1 2-2h5.2a2 2 0 0 1 1.4.6Z"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/></>,
  'credit-card': <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4"/></>,
  building:      <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-4h4v4"/></>,
  link:          <><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
  refresh:       <><path d="M21 12a9 9 0 1 1-3.5-7.1"/><path d="M21 4v6h-6"/></>,
  bell:          <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></>,
  'log-out':     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,
  moon:          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
  sun:           <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></>,
  sparkles:      <><path d="m12 3 1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8L12 3Z"/><path d="m19 14 .9 2.1 2.1.9-2.1.9L19 20l-.9-2.1-2.1-.9 2.1-.9Z"/></>,
  'trending-up': <><path d="m22 7-9 9-4-4-7 7"/><path d="M16 7h6v6"/></>,
  'trending-down':<><path d="m22 17-9-9-4 4-7-7"/><path d="M16 17h6v-6"/></>,
  filter:        <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
  download:      <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>,
  upload:        <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>,
  utensils:      <><path d="M3 2v7c0 1.5 1 3 3 3v10M6 2v7M10 2v7"/><path d="M14 2v20l4-4V8a4 4 0 0 0-4-6Z"/></>,
  'shopping-basket':<><path d="m5 11 1 9h12l1-9"/><path d="M3 11h18"/><path d="m8 11 2-7M16 11l-2-7"/></>,
  car:           <><path d="M5 17h14M5 17V10l2-5h10l2 5v7M5 17a2 2 0 1 0 4 0M15 17a2 2 0 1 0 4 0"/></>,
  bolt:          <path d="M13 3 3 14h7l-1 7 10-11h-7z"/>,
  film:          <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 12h18M3 7h4M3 17h4M17 7h4M17 17h4"/></>,
  'heart-pulse': <><path d="M3.5 12.6a5 5 0 0 1 7.5-6.6l1 1 1-1a5 5 0 0 1 7.5 6.6L12 21Z"/><path d="M2 13h4l2-3 3 6 2-4h9"/></>,
  'shopping-bag':<><path d="M6 7h12l-1 14H7Z"/><path d="M9 7a3 3 0 1 1 6 0"/></>,
  'book-open':   <><path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8Z"/></>,
  plane:         <path d="M3 12 21 4l-3 9 3 9-18-8 4-2-4-4 6 1z"/>,
  users:         <><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="8" r="3"/><path d="M22 19a5 5 0 0 0-3-4.6"/></>,
  'hand-heart':  <><path d="M11 14 8 11l3-3 3 3-3 3z"/><path d="m4 14 4 4 6-2 8-6-2-2-6 4-3-3-4 2z"/></>,
  'piggy-bank':  <><path d="M19 9a3 3 0 0 0-3-3h-4a6 6 0 0 0-6 6 6 6 0 0 0 4 5.6V20h3v-2h2v2h3v-2.4A6 6 0 0 0 22 12V9z"/><circle cx="15" cy="11" r="1" fill="currentColor"/></>,
  'arrow-left-right':<><path d="m17 3 4 4-4 4"/><path d="M21 7H3"/><path d="m7 21-4-4 4-4"/><path d="M3 17h18"/></>,
  'help-circle': <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3 4c-1 .5-1 1-1 2"/><circle cx="12" cy="17" r=".8" fill="currentColor"/></>,
  'arrow-down-circle':<><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12l4 4 4-4"/></>,
  command:       <><path d="M6 18a3 3 0 1 1 3-3v6"/><path d="M15 6a3 3 0 1 1 3 3h-6"/><path d="M9 6a3 3 0 1 1-3 3h6"/><path d="M18 15a3 3 0 1 1-3 3v-6"/></>,
  menu:          <><path d="M3 6h18M3 12h18M3 18h18"/></>,
  eye:           <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  'eye-off':     <><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a17.85 17.85 0 0 1-3.16 4.19"/><path d="M6.6 6.6A17.92 17.92 0 0 0 2 11s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M2 2l20 20"/></>,
}

interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: keyof typeof PATHS | string
  size?: number | string
  strokeWidth?: number
}

export function Icon({ name, size = 18, strokeWidth = 1.75, className, ...rest }: IconProps) {
  const path = PATHS[name as string] ?? PATHS['help-circle']
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      {...rest}
    >
      {path}
    </svg>
  )
}
