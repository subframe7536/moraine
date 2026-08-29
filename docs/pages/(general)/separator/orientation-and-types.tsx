import { Separator } from '@src'

export function OrientationAndTypes() {
  return (
    <div class="max-w-sm space-y-3">
      <p class="text-sm font-medium">Account settings</p>
      <Separator type="dashed" />
      <div class="text-sm text-muted-foreground flex gap-3 items-center">
        <span>Profile</span>
        <Separator orientation="vertical" class="h-4" decorative />
        <span>Security</span>
        <Separator orientation="vertical" class="h-4" decorative />
        <span>Billing</span>
      </div>
    </div>
  )
}
