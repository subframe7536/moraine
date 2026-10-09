import { Tabs } from '@src'
import type { TabsT } from '@src'

const TABS: TabsT.Item[] = [
  {
    value: 'overview',
    label: 'Overview',
    content: (
      <div class="text-xs text-muted-foreground p-3">System status and resource metrics.</div>
    ),
  },
  {
    value: 'analytics',
    label: 'Analytics',
    content: (
      <div class="text-xs text-muted-foreground p-3">Traffic breakdowns and request volume.</div>
    ),
  },
  {
    value: 'logs',
    label: 'Logs',
    content: (
      <div class="text-xs text-muted-foreground p-3">Real-time application execution stream.</div>
    ),
  },
]

export function ActivationUsage() {
  return (
    <div class="max-w-md w-full">
      <Tabs items={TABS} activationMode="automatic" defaultValue="overview" />
    </div>
  )
}
