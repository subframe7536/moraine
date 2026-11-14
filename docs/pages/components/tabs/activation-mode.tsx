import { Tabs } from '@src'
import type { TabsT } from '@src'

const SETTINGS_TABS: TabsT.Item[] = [
  {
    label: 'General',
    value: 'general',
    icon: 'i-lucide:sliders',
    content: (
      <div class="p-3 space-y-1">
        <h4 class="text-sm font-semibold">Workspace defaults</h4>
        <p class="text-xs text-muted-foreground">
          Name, timezone, and default branch. Arrow keys move focus; Enter or Space opens the panel.
        </p>
      </div>
    ),
  },
  {
    label: 'Deployments',
    value: 'deployments',
    icon: 'i-lucide:rocket',
    content: (
      <div class="p-3 space-y-1">
        <h4 class="text-sm font-semibold">Deployment gates</h4>
        <p class="text-xs text-muted-foreground">
          Require reviews before production. Manual activation keeps the previous panel visible
          until you confirm.
        </p>
      </div>
    ),
  },
  {
    label: 'Notifications',
    value: 'notifications',
    icon: 'i-lucide:bell',
    content: (
      <div class="p-3 space-y-1">
        <h4 class="text-sm font-semibold">Alert rules</h4>
        <p class="text-xs text-muted-foreground">Configure webhook dispatch channels.</p>
      </div>
    ),
  },
]

export function ActivationMode() {
  return (
    <div class="max-w-md w-full">
      <Tabs items={SETTINGS_TABS} activationMode="manual" defaultValue="general" />
    </div>
  )
}
