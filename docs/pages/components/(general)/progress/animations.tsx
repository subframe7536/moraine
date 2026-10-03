import { Progress } from '@src'
import type { ProgressT } from '@src'
import { For } from 'solid-js'

type ProgressAnimation = Exclude<ProgressT.Variant['animation'], undefined>

export function Animations() {
  const ANIMATIONS: ProgressAnimation[] = ['carousel', 'reverse', 'swing', 'elastic']

  return (
    <div class="w-xl space-y-3">
      <For each={ANIMATIONS}>
        {(animation) => (
          <div class="flex gap-3 items-center">
            <span class="text-xs text-muted-foreground font-mono w-16">{animation}</span>
            <div class="flex-1">
              <Progress value={null} animation={animation} />
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
