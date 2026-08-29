import { Badge } from '@src'

export function BadgeUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Badge leading="i-lucide:check-circle">Active</Badge>
      <Badge variant="outline" leading="i-lucide:clock">
        Pending
      </Badge>
      <Badge variant="solid" leading="i-lucide:sparkles">
        New feature
      </Badge>
    </div>
  )
}
