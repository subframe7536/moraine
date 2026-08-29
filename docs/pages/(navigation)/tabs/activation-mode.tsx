import { Tabs } from '@src'
import type { TabsT } from '@src'

const SETTINGS_TABS: TabsT.Item[] = [
  {
    label: 'General',
    value: 'general',
    icon: 'i-lucide:sliders',
    content: (
      <div class="p-3 b-(1 border) rounded-xl bg-card/40 space-y-2">
        <h4 class="text-sm font-semibold">General Preferences</h4>
        <p class="text-xs text-muted-foreground">
          Automatic activation triggers immediately on arrow navigation.
        </p>
      </div>
    ),
  },
  {
    label: 'Deployments',
    value: 'deployments',
    icon: 'i-lucide:rocket',
    content: (
      <div class="p-3 b-(1 border) rounded-xl bg-card/40 space-y-2">
        <h4 class="text-sm font-semibold">Deployment Settings</h4>
        <p class="text-xs text-muted-foreground">
          Manual activation requires pressing Enter or Space to commit selection.
        </p>
      </div>
    ),
  },
  {
    label: 'Notifications',
    value: 'notifications',
    icon: 'i-lucide:bell',
    content: (
      <div class="p-3 b-(1 border) rounded-xl bg-card/40 space-y-2">
        <h4 class="text-sm font-semibold">Alert Rules</h4>
        <p class="text-xs text-muted-foreground">Configure webhook dispatch channels.</p>
      </div>
    ),
  },
]

export function ActivationMode() {
  return (
    <div class="gap-6 grid max-w-2xl sm:grid-cols-2">
      <div class="space-y-2">
        <span class="text-xs text-muted-foreground tracking-wider font-semibold uppercase">
          Automatic Activation
        </span>
        <Tabs items={SETTINGS_TABS} activationMode="automatic" defaultValue="general" />
      </div>
      <div class="space-y-2">
        <span class="text-xs text-muted-foreground tracking-wider font-semibold uppercase">
          Manual Activation (Enter / Space)
        </span>
        <Tabs items={SETTINGS_TABS} activationMode="manual" defaultValue="general" />
      </div>
    </div>
  )
}
