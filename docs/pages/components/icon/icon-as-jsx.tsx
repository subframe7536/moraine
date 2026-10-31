import { Icon } from '@src'

// Rendered without props; Icon applies class and ARIA attributes to its own root.
function BoltGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

export function IconAsJSX() {
  return (
    <div class="flex gap-4 items-center">
      <Icon
        name={
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        }
        aria-label="Status"
      />
      <Icon name={BoltGlyph} aria-label="Boost" />
    </div>
  )
}
