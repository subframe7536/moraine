import { Badge } from '@src'

export function StatusAndMetadata() {
  return (
    <div class="p-4 b-(1 border) max-w-xl space-y-4 rounded-xl">
      <div class="space-y-1.5">
        <p class="text-muted-foreground tracking-wider font-semibold uppercase text-xs">
          Deployment Pipeline
        </p>
        <div class="flex flex-wrap gap-3 items-center">
          <Badge variant="solid" leading="i-lucide:check-circle">
            Production Deployed
          </Badge>
          <Badge variant="subtle" leading="i-lucide:loader-circle">
            Building Preview...
          </Badge>
          <Badge variant="outline" leading="i-lucide:shield-check">
            Security Audit Passed
          </Badge>
        </div>
      </div>

      <div class="pt-2 border-t border-border space-y-1.5">
        <p class="text-muted-foreground tracking-wider font-semibold uppercase text-xs">
          Git Metadata
        </p>
        <div class="flex flex-wrap gap-3 items-center">
          <Badge variant="outline" trailing="i-lucide:git-commit">
            commit: #9f82a1
          </Badge>
          <Badge variant="outline" leading="i-lucide:users">
            34 contributors
          </Badge>
          <Badge variant="outline" leading="i-lucide:star">
            1.2k stars
          </Badge>
        </div>
      </div>
    </div>
  )
}
