import { Badge } from '@src'

export function Sizes() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Badge size="sm" variant="outline" leading="i-lucide:tag">
        sm / v1.0.4
      </Badge>
      <Badge size="md" variant="default" leading="i-lucide:activity">
        md / 99.9% Uptime
      </Badge>
      <Badge size="lg" variant="solid" leading="i-lucide:rocket">
        lg / Production Ready
      </Badge>
    </div>
  )
}
