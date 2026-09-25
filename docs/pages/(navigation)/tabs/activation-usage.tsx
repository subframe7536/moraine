import { Tabs } from '@src'
import type { TabsT } from '@src'

const TABS: TabsT.Item[] = [
  {
    value: 'tab1',
    label: 'Overview',
    content: (
      <div class="text-muted-foreground p-3 text-xs">System status and resource metrics.</div>
    ),
  },
  {
    value: 'tab2',
    label: 'Analytics',
    content: (
      <div class="text-muted-foreground p-3 text-xs">Traffic breakdowns and request volume.</div>
    ),
  },
  {
    value: 'tab3',
    label: 'Logs',
    content: (
      <div class="text-muted-foreground p-3 text-xs">Real-time application execution stream.</div>
    ),
  },
]

export function ActivationUsage() {
  return (
    <div class="max-w-md w-full space-y-4">
      <div class="space-y-1.5">
        <span class="text-muted-foreground font-medium text-xs">
          Automatic activation (focus selects tab)
        </span>
        <Tabs items={TABS} activationMode="automatic" defaultValue="tab1" />
      </div>
      <div class="space-y-1.5">
        <span class="text-muted-foreground font-medium text-xs">
          Manual activation (Enter / Space selects tab)
        </span>
        <Tabs items={TABS} activationMode="manual" defaultValue="tab1" />
      </div>
    </div>
  )
}
