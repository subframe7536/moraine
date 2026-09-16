import { Badge } from '@src'

export function BadgeUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Badge variant="solid" leading="i-lucide:sparkles">
        Solid
      </Badge>
      <Badge variant="subtle" leading="i-lucide:check-circle">
        Subtle
      </Badge>
      <Badge variant="surface" trailing="i-lucide:arrow-right">
        Surface
      </Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge size="sm" leading="i-lucide:check" aria-label="Complete" />
      <Badge size="lg">Large</Badge>
    </div>
  )
}
