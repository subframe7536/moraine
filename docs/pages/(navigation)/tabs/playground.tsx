import { Tabs } from '@src'
import type { TabsT } from '@src'

const ITEMS: TabsT.Item[] = [
  {
    label: 'Overview',
    value: 'overview',
    icon: 'i-lucide:layout-dashboard',
    content: (
      <p class="text-xs text-muted-foreground leading-relaxed pt-3">
        High-level metrics and system activity overview.
      </p>
    ),
  },
  {
    label: 'Deployments',
    value: 'deployments',
    icon: 'i-lucide:rocket',
    content: (
      <p class="text-xs text-muted-foreground leading-relaxed pt-3">
        Production pipelines, recent builds, and rollout health.
      </p>
    ),
  },
  {
    label: 'Settings',
    value: 'settings',
    icon: 'i-lucide:settings',
    content: (
      <p class="text-xs text-muted-foreground leading-relaxed pt-3">
        Environment variables, security secrets, and domain management.
      </p>
    ),
  },
]

export interface TabsPlaygroundProps {
  variant?: TabsT.Variant['variant']
  size?: TabsT.Variant['size']
  disabled?: boolean
}

export function TabsPlayground(props: TabsPlaygroundProps) {
  return (
    <div class="max-w-lg w-full">
      <Tabs
        defaultValue="overview"
        variant={props.variant ?? 'pill'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        items={ITEMS}
      />
    </div>
  )
}
