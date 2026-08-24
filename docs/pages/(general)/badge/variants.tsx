import { Badge } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Badge variant="default" leading="i-lucide:sparkles">
        New Feature
      </Badge>
      <Badge variant="outline" leading="i-lucide:git-branch">
        v2.4.0
      </Badge>
      <Badge variant="solid" leading="i-lucide:crown">
        Pro Plan
      </Badge>
    </div>
  )
}
