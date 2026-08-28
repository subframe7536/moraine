import { Tabs } from '@src'

const TABS = [
  {
    value: 'tab1',
    label: 'Overview',
    children: <div class="text-xs text-muted-foreground p-3">General overview.</div>,
  },
  {
    value: 'tab2',
    label: 'Analytics',
    children: <div class="text-xs text-muted-foreground p-3">Usage charts.</div>,
  },
  {
    value: 'tab3',
    label: 'Logs',
    children: <div class="text-xs text-muted-foreground p-3">Server logs.</div>,
  },
]

export function ActivationUsage() {
  return (
    <div class="max-w-md w-full space-y-4">
      <div class="space-y-1.5">
        <span class="text-xs text-muted-foreground font-medium">
          Automatic activation (focus selects tab)
        </span>
        <Tabs items={TABS} activationMode="automatic" defaultValue="tab1" />
      </div>
      <div class="space-y-1.5">
        <span class="text-xs text-muted-foreground font-medium">
          Manual activation (Enter / Space selects tab)
        </span>
        <Tabs items={TABS} activationMode="manual" defaultValue="tab1" />
      </div>
    </div>
  )
}
