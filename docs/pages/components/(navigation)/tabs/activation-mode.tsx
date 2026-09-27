import { Tabs } from '@src'
import type { TabsT } from '@src'

const SETTINGS_TABS: TabsT.Item[] = [
  {
    label: 'General',
    value: 'general',
    icon: 'i-lucide:sliders',
    content: (
      <div class="p-3 b-(1 border) bg-card/40 space-y-2 rounded-xl">
        <h4 class="font-semibold text-sm">General Preferences</h4>
        <p class="text-muted-foreground text-xs">
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
      <div class="p-3 b-(1 border) bg-card/40 space-y-2 rounded-xl">
        <h4 class="font-semibold text-sm">Deployment Settings</h4>
        <p class="text-muted-foreground text-xs">
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
      <div class="p-3 b-(1 border) bg-card/40 space-y-2 rounded-xl">
        <h4 class="font-semibold text-sm">Alert Rules</h4>
        <p class="text-muted-foreground text-xs">Configure webhook dispatch channels.</p>
      </div>
    ),
  },
]

export function ActivationMode() {
  return (
    <div class="gap-6 grid max-w-2xl sm:grid-cols-2">
      <div class="space-y-2">
        <span class="text-muted-foreground tracking-wider font-semibold uppercase text-xs">
          Automatic Activation
        </span>
        <Tabs items={SETTINGS_TABS} activationMode="automatic" defaultValue="general" />
      </div>
      <div class="space-y-2">
        <span class="text-muted-foreground tracking-wider font-semibold uppercase text-xs">
          Manual Activation (Enter / Space)
        </span>
        <Tabs items={SETTINGS_TABS} activationMode="manual" defaultValue="general" />
      </div>
    </div>
  )
}
