import { Kbd } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <div class="flex gap-1.5 items-center">
        <span class="text-xs text-muted-foreground">Outline:</span>
        <Kbd variant="outline" value="⌘" />
        <Kbd variant="outline" value="K" />
      </div>

      <div class="flex gap-1.5 items-center">
        <span class="text-xs text-muted-foreground">Default:</span>
        <Kbd variant="default" value="⌥" />
        <Kbd variant="default" value="Enter" />
      </div>

      <div class="flex gap-1.5 items-center">
        <span class="text-xs text-muted-foreground">Invert:</span>
        <Kbd variant="invert" value="⇧" />
        <Kbd variant="invert" value="Esc" />
      </div>
    </div>
  )
}
