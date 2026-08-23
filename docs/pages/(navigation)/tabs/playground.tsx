import { Tabs } from '@src'
import type { TabsT } from '@src'

const ITEMS: TabsT.Item[] = [
  { label: 'Overview', value: 'overview', content: <p class="text-sm">Overview panel.</p> },
  { label: 'Settings', value: 'settings', content: <p class="text-sm">Settings panel.</p> },
]

export interface TabsPlaygroundProps {
  variant?: TabsT.Variant['variant']
  disabled?: boolean
}

export function TabsPlayground(props: TabsPlaygroundProps) {
  return (
    <div class="w-full max-w-lg">
      <Tabs
        defaultValue="overview"
        variant={props.variant ?? 'pill'}
        disabled={props.disabled ?? false}
        items={ITEMS}
      />
    </div>
  )
}
