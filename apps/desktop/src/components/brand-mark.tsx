import { cn } from '@/lib/utils'

// Neutral app tile.
//
// This used to render the Nous "nous-girl" mark on a white card. The branded
// artwork is gone from this build (see the Xinyuan fork notes), so the tile is
// now a plain, theme-independent placeholder. It stays a component — and keeps
// the same `size-*`-driven API — so the five call sites keep their layout, and
// the mark itself is drawn as a percentage-sized SVG that scales with whatever
// className the caller passes.
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
