import { PinInput } from '@src'
import { createSignal, Show } from 'solid-js'

export function CustomSeparator() {
  const [value, setValue] = createSignal('')

  return (
    <div class="flex flex-col gap-3">
      <PinInput
        length={6}
        separator={3}
        separatorRender={() => <span class="text-muted-foreground font-semibold px-1">-</span>}
        onComplete={(val) => setValue(val)}
      />
      <Show when={value()}>
        <p class="text-xs text-muted-foreground">Code: {value()}</p>
      </Show>
    </div>
  )
}
