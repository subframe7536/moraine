import { Button, ScrollArea } from '@src'
import type { ScrollAreaT } from '@src'
import { For, createSignal } from 'solid-js'

const visibilityOptions: ScrollAreaT.Visibility[] = ['auto', 'top', 'bottom', 'both', 'none']

export function Visibility() {
  const [visibility, setVisibility] = createSignal<ScrollAreaT.Visibility>('auto')
  const [overflow, setOverflow] = createSignal<Exclude<ScrollAreaT.Visibility, 'auto'>>('none')

  return (
    <div class="w-full space-y-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Shadow visibility">
        <For each={visibilityOptions}>
          {(option) => (
            <Button
              size="sm"
              variant={visibility() === option ? 'default' : 'outline'}
              aria-pressed={visibility() === option}
              onClick={() => setVisibility(option)}
            >
              {option}
            </Button>
          )}
        </For>
      </div>
      <ScrollArea
        shadow
        shadowSize={24}
        offset={8}
        visibility={visibility()}
        onVisibilityChange={setOverflow}
        class="pr-3 h-48 max-w-sm w-full space-y-1"
        role="region"
        aria-label="Visibility example activity"
      >
        <For each={Array.from({ length: 10 }, (_, index) => index + 1)}>
          {(entry) => <p class="text-sm py-1.5">Activity entry {entry}</p>}
        </For>
      </ScrollArea>
      <p class="text-sm text-muted-foreground">
        Measured overflow: <output aria-live="polite">{overflow()}</output>
      </p>
    </div>
  )
}
