import { KbdGroup } from '@src'

export function KbdGroupUsage() {
  return (
    <div class="flex flex-col gap-3">
      <div class="flex gap-2 items-center">
        <span class="text-sm text-muted-foreground">Save document:</span>
        <KbdGroup keys={['command', 's']} />
      </div>
      <div class="flex gap-2 items-center">
        <span class="text-sm text-muted-foreground">Format document:</span>
        <KbdGroup keys={['shift', 'alt', 'f']} />
      </div>
    </div>
  )
}
