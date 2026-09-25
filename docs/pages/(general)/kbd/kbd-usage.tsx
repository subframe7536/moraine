import { Kbd } from '@src'

export function KbdUsage() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <span class="text-muted-foreground flex gap-1.5 items-center text-sm">
        Press <Kbd value="command" /> <Kbd value="k" /> to search
      </span>
      <span class="text-muted-foreground flex gap-1.5 items-center text-sm">
        Press <Kbd value="escape" /> to cancel
      </span>
    </div>
  )
}
