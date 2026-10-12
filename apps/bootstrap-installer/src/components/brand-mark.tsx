import { cn } from '../lib/utils'

// Neutral brand tile.
//
// Ported from apps/desktop's BrandMark. The installer has no theme system, so
// the tile is a single fixed gradient rather than a light/dark pair — but the
// component keeps the same `size-*`-driven API so every call site is unchanged.
//
// The glyph is the same X as the generated app icon (assets/nous-girl-*.svg →
// scripts/generate_icons.py), so the installer and the app agree.
export function BrandMark({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-indigo-500 to-violet-500',
        className
      )}
      {...props}
    >
      <svg aria-hidden="true" className="size-[52%]" viewBox="0 0 24 24">
        <path
          d="M4.5 4.5 19.5 19.5M19.5 4.5 4.5 19.5"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
      </svg>
    </span>
  )
}
