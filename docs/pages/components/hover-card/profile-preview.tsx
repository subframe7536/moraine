import { Avatar, Badge, HoverCard } from '@src'
export function ProfilePreview() {
  return (
    <p class="text-sm text-foreground leading-6 max-w-xs">
      The component library is maintained by{' '}
      <HoverCard openDelay={200} closeDelay={120}>
        <HoverCard.Trigger href="/u/alex.morgan" class="font-medium underline underline-offset-4">
          @alex.morgan
        </HoverCard.Trigger>
        <HoverCard.Content>
          <div class="space-y-3">
            <Avatar text="AM" alt="Alex Morgan" size="lg" />
            <div>
              <div class="flex gap-1.5 items-center">
                <h4 class="text-sm font-semibold">Alex Morgan</h4>
                <Badge variant="outline" size="sm">
                  Maintainer
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground font-mono">@alex.morgan</p>
            </div>
            <p class="text-xs text-foreground">
              Building accessible, high-performance UI primitives for SolidJS and web standards.
            </p>
            <div class="text-xs text-muted-foreground pt-2 border-t border-border flex gap-3">
              <span>
                <strong class="text-foreground font-semibold">1.4k</strong> followers
              </span>
              <span>
                <strong class="text-foreground font-semibold">328</strong> following
              </span>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard>{' '}
      and the wider community, with new primitives landing in each release cycle.
    </p>
  )
}
