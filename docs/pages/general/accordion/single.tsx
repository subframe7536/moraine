import { Accordion } from '@src'
import { createSignal } from 'solid-js'

export function Single() {
  const [openValue, setOpenValue] = createSignal<string[]>(['shipping'])

  return (
    <div class="w-lg space-y-3">
      <Accordion
        value={openValue()}
        onChange={setOpenValue}
        items={[
          {
            value: 'shipping',
            label: 'Shipping information',
            leading: 'i-lucide-truck',
            content:
              'Orders are processed in 1-2 business days and delivered in 3-5 business days.',
          },
          {
            value: 'returns',
            label: 'Returns policy',
            leading: 'i-lucide-rotate-ccw',
            content: 'Returns are accepted within 30 days of delivery.',
          },
          {
            value: 'support',
            label: 'Support',
            leading: 'i-lucide-life-buoy',
            content: 'Reach support any time at support@example.com.',
          },
        ]}
      />

      <p class="text-xs text-muted-foreground">Current open value: {openValue()?.[0] ?? 'none'}</p>
    </div>
  )
}
