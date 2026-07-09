import { Avatar } from '@src'

export function BadgePositions() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Avatar text="A" badge="i-lucide-check" badgePosition="top-left" />
      <Avatar text="B" badge="i-lucide-check" badgePosition="top-right" />
      <Avatar text="C" badge="i-lucide-check" badgePosition="bottom-left" />
      <Avatar text="D" badge="i-lucide-check" badgePosition="bottom-right" />
    </div>
  )
}
