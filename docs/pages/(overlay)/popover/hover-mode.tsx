import { Avatar, Badge, Button, Popover } from '@src'

export function HoverMode() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Popover
        mode="hover"
        openDelay={180}
        closeDelay={120}
        content={
          <div class="p-4 rounded-xl bg-card max-w-xs space-y-3">
            <div class="flex items-start justify-between">
              <Avatar text="AM" alt="Alex Morgan" size="lg" />
              <Button size="xs" variant="default">
                Follow
              </Button>
            </div>

            <div>
              <div class="flex gap-1.5 items-center">
                <h4 class="text-sm font-semibold">Alex Morgan</h4>
                <Badge variant="outline" size="sm">
                  Author
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground font-mono">@alex.morgan</p>
            </div>

            <p class="text-xs text-foreground">
              Building accessible, high-performance UI primitives for SolidJS and web standards.
            </p>

            <div class="text-xs text-muted-foreground pt-1 border-t border-border flex gap-3">
              <span>
                <strong class="text-foreground font-semibold">1.4k</strong> followers
              </span>
              <span>
                <strong class="text-foreground font-semibold">328</strong> following
              </span>
            </div>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide:user">
            Hover for Author Card
          </Button>
        )}
      </Popover>
    </div>
  )
}
