import { Accordion } from '@src'
import { createSignal } from 'solid-js'

const FAQ_ITEMS = [
  {
    value: 'q1',
    label: 'Is Moraine SSR-compatible?',
    content: 'Yes, Moraine is designed for full SolidStart SSR and SSG hydration safety.',
  },
  {
    value: 'q2',
    label: 'What styling engine is used?',
    content: 'Moraine uses UnoCSS with customizable Tailwind-compatible theme tokens.',
  },
]

export function OpenItems() {
  const [active, setActive] = createSignal<string[]>(['q1'])

  return (
    <div class="max-w-md w-full space-y-3">
      <Accordion collapsible items={FAQ_ITEMS} value={active()} onChange={setActive} />
      <p class="text-xs text-muted-foreground">
        Open item: <span class="text-foreground font-mono">{active()[0] ?? 'none'}</span>
      </p>
    </div>
  )
}
