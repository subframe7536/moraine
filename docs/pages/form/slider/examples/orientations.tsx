import { Slider } from '@src'

export function Orientations() {
  return (
    <div class="gap-8 grid items-start sm:grid-cols-2">
      <div class="w-50 space-y-2">
        <label class="text-xs text-muted-foreground block">Horizontal</label>
        <Slider defaultValue={45} />
      </div>
      <div class="space-y-2">
        <label class="text-xs text-muted-foreground block">Vertical</label>
        <div class="flex h-48 items-center">
          <Slider orientation="vertical" defaultValue={45} />
        </div>
      </div>
    </div>
  )
}
