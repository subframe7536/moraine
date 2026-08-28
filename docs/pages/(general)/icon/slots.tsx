import { Icon } from '@src'

export function Slots() {
  return (
    <div class="flex gap-4 items-center">
      <span class="text-sm text-muted-foreground inline-flex gap-1.5 items-center">
        <Icon name="i-lucide:info" slotName="custom-icon" class="text-blue-500" />
        Custom slot icon
      </span>
    </div>
  )
}
