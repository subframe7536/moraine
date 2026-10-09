import { Icon } from '@src'

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
      <Icon name={() => <div class="i-lucide-zap size-6" />} aria-label="Boost" />
    </div>
  )
}
