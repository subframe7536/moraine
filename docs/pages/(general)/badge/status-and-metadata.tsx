import { Badge } from '@src'

export function StatusAndMetadata() {
  return (
    <div class="space-y-2">
      <div class="flex flex-wrap gap-3 items-center">
        <Badge variant="solid" leading="i-lucide-check-check">
          Published
        </Badge>
        <Badge variant="default">测试</Badge>
        <Badge variant="outline" trailing="i-lucide-git-branch">
          v0.1.0
        </Badge>
        <Badge variant="outline" leading="i-lucide-users">
          24 contributors
        </Badge>
      </div>
    </div>
  )
}
