import { Avatar } from '@src'

export function BadgePositions() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Avatar text="A" icon="i-lucide-check" badgePosition="top-left" />
      <Avatar text="B" icon="i-lucide-check" badgePosition="top-right" />
      <Avatar text="C" icon="i-lucide-check" badgePosition="bottom-left" />
      <Avatar text="D" icon="i-lucide-check" badgePosition="bottom-right" />
    </div>
  )
}
