import { Separator } from '@src'

export function Orientation() {
  return (
    <div class="max-w-sm space-y-3">
      <p class="font-medium text-sm">Account settings</p>
      <Separator />
      <div class="text-muted-foreground flex gap-3 items-center text-sm">
        <span>Profile</span>
        <Separator orientation="vertical" class="h-4" />
        <span>Security</span>
        <Separator orientation="vertical" class="h-4" />
        <span>Billing</span>
      </div>
    </div>
  )
}
