import { Avatar } from '@src'

export function BadgePositions() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Avatar alt="Sarah Connor" text="SC" badge="i-lucide:check" badgePosition="bottom-right" />
      <Avatar
        alt="On-call engineer"
        text="OC"
        badge="i-lucide:circle-alert"
        badgePosition="top-right"
      />
    </div>
  )
}
