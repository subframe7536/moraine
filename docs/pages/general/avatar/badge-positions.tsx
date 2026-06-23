import { Avatar } from '@src'

export function BadgePositions() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Avatar items={[{ text: 'A', icon: 'i-lucide-check', badgePosition: 'top-left' }]} />
      <Avatar items={[{ text: 'B', icon: 'i-lucide-check', badgePosition: 'top-right' }]} />
      <Avatar items={[{ text: 'C', icon: 'i-lucide-check', badgePosition: 'bottom-left' }]} />
      <Avatar items={[{ text: 'D', icon: 'i-lucide-check', badgePosition: 'bottom-right' }]} />
    </div>
  )
}
