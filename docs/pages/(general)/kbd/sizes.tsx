import { Kbd } from '@src'

export function Sizes() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex gap-1.5 items-center">
        <span class="text-xs text-muted-foreground">Small (sm):</span>
        <Kbd size="sm" value="⌘" />
        <Kbd size="sm" value="K" />
      </div>

      <div class="flex gap-1.5 items-center">
        <span class="text-xs text-muted-foreground">Medium (md):</span>
        <Kbd size="md" value="Ctrl" />
        <Kbd size="md" value="Shift" />
        <Kbd size="md" value="P" />
      </div>

      <div class="flex gap-1.5 items-center">
        <span class="text-xs text-muted-foreground">Large (lg):</span>
        <Kbd size="lg" value="Space" />
      </div>
    </div>
  )
}
