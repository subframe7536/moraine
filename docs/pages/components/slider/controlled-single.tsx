import { Button, Slider } from '@src'
import { createSignal } from 'solid-js'

export function ControlledSingle() {
  const [volume, setVolume] = createSignal(75)

  const volumeIcon = () => {
    if (volume() === 0) {
      return 'i-lucide:volume-x'
    }
    if (volume() < 50) {
      return 'i-lucide:volume-1'
    }
    return 'i-lucide:volume-2'
  }

  return (
    <div class="p-4 border border-border rounded-xl max-w-md w-full space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            leading={volumeIcon()}
            onClick={() => setVolume((v) => (v === 0 ? 75 : 0))}
            aria-label="Mute / Unmute"
          />
          <span class="text-sm font-medium">Output volume</span>
        </div>
        <span class="text-xs text-primary font-mono font-semibold">{volume()}%</span>
      </div>

      <Slider value={volume()} min={0} max={100} step={1} onValueChange={setVolume} />
    </div>
  )
}
