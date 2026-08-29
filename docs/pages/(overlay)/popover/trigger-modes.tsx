import { Avatar, Badge, Button, Popover } from '@src'

export function TriggerModes() {
  return (
    <div class="flex flex-wrap gap-4 items-center">
      <Popover
        content={
          <div class="p-3 w-64 space-y-2">
            <h4 class="text-xs text-foreground font-semibold">Filter Deployments</h4>
            <p class="text-xs text-muted-foreground">
              Click-triggered popover remains open during interactive selections.
            </p>
            <div class="pt-1 flex gap-1.5">
              <Badge variant="outline" size="sm">
                Production
              </Badge>
              <Badge variant="outline" size="sm">
                Staging
              </Badge>
              <Badge variant="outline" size="sm">
                Canary
              </Badge>
            </div>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="outline" leading="i-lucide:sliders-horizontal">
            Click to Filter
          </Button>
        )}
      </Popover>

      <Popover
        mode="hover"
        openDelay={150}
        closeDelay={100}
        content={
          <div class="p-3 w-56 space-y-2">
            <div class="flex gap-2 items-center">
              <Avatar text="AR" size="sm" />
              <div>
                <p class="text-xs text-foreground font-semibold">Alex Rivera</p>
                <p class="text-[0.7rem] text-muted-foreground">Core Maintainer</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              Hover-triggered info preview with automatic delay timers.
            </p>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="ghost" leading="i-lucide:user">
            Hover for Profile
          </Button>
        )}
      </Popover>
    </div>
  )
}
