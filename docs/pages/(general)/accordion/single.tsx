import { Accordion } from '@src'
import { createSignal } from 'solid-js'

export function Single() {
  const [openValue, setOpenValue] = createSignal<string[]>(['accessibility'])

  return (
    <div class="max-w-xl w-full space-y-3">
      <Accordion
        value={openValue()}
        onChange={setOpenValue}
        items={[
          {
            value: 'accessibility',
            label: 'Is Moraine fully accessible (WAI-ARIA compliant)?',
            leading: 'i-lucide:sparkles',
            content:
              'Yes. Every primitive is built according to W3C WAI-ARIA authoring practices, featuring full keyboard navigation, roving focus, and screen-reader announcements.',
          },
          {
            value: 'ssr',
            label: 'Does it support SSR and hydration in SolidStart?',
            leading: 'i-lucide:server',
            content:
              'All components are tested for strict SSR safety, deterministic ID generation, and identical client/server hydration trees without layout shifts.',
          },
          {
            value: 'customization',
            label: 'How does styling and theme customization work?',
            leading: 'i-lucide:palette',
            content:
              'Moraine uses UnoCSS / Tailwind utility tokens with semantic variables. You can override classes cleanly using the classes prop or custom themes.',
          },
        ]}
      />

      <p class="text-xs text-muted-foreground">
        Active section:{' '}
        <span class="text-foreground font-medium">{openValue()?.[0] ?? 'none'}</span>
      </p>
    </div>
  )
}
