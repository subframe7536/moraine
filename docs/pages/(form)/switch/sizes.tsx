import { Switch } from '@src'

export function Sizes() {
  return (
    <div class="flex flex-col gap-4 max-w-xl">
      <Switch
        size="sm"
        label="Auto-renew domain license"
        description="Small compact row toggle (sm)"
        defaultChecked
      />
      <Switch
        size="md"
        label="Enable push notifications"
        description="Standard form settings toggle (md)"
        defaultChecked
      />
      <Switch
        size="lg"
        label="Developer Mode & Debugging Tools"
        description="Prominent hero feature switch with large touch target (lg)"
      />
    </div>
  )
}
