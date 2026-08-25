import { Tabs } from '@src'

const ITEMS = [
  { label: 'Overview', value: 'overview', content: <p class="text-sm pt-3">Overview panel</p> },
  { label: 'Activity', value: 'activity', content: <p class="text-sm pt-3">Activity panel</p> },
  { label: 'Settings', value: 'settings', content: <p class="text-sm pt-3">Settings panel</p> },
]

export function ActivationMode() {
  return (
    <div class="gap-6 grid max-w-2xl sm:grid-cols-2">
      <div>
        <p class="text-sm font-medium mb-2">Automatic</p>
        <Tabs items={ITEMS} activationMode="automatic" />
      </div>
      <div>
        <p class="text-sm font-medium mb-2">Manual</p>
        <Tabs items={ITEMS} activationMode="manual" keyboardLoop={false} />
      </div>
    </div>
  )
}
