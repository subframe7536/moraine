import { Slider } from '@src'
import { createSignal } from 'solid-js'

export function BlurSlider() {
  const [value, setValue] = createSignal(32)

  return (
    <div class="py-6 flex w-full justify-center">
      <Slider
        variant="bold"
        value={value()}
        onValueChange={(val: number | number[]) => {
          if (typeof val === 'number') {
            setValue(val)
          }
        }}
        min={0}
        max={100}
        step={1}
        aria-label="Blur"
        class="h-12 max-w-md w-full isolate"
        classes={{
          track:
            '[--s-size:48px] [--s-len:28px] [--s-offset:4px] [--s-pos:max(4px,calc(100%-8px))] rounded-xl',
          thumb: 'rounded-xl',
        }}
      >
        <div class="text-sm font-semibold px-5 flex pointer-events-none items-center inset-0 justify-between absolute">
          <span class="text-white mix-blend-difference">Blur</span>
          <span class="text-white font-mono mix-blend-difference">{Math.round(value())}px</span>
        </div>
      </Slider>
    </div>
  )
}
