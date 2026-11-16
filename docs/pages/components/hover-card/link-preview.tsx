import { HoverCard, Icon } from '@src'

export function LinkPreview() {
  return (
    <p class="text-sm text-foreground leading-6 max-w-xs">
      New here? Start with the{' '}
      <HoverCard placement="top" openDelay={300}>
        <HoverCard.Trigger
          href="/docs/getting-started"
          class="font-medium underline underline-offset-4"
        >
          getting started guide for new contributors to the design system
        </HoverCard.Trigger>
        <HoverCard.Content>
          <div class="space-y-2">
            <h4 class="text-sm font-semibold">Getting started</h4>
            <p class="text-xs text-foreground">
              Install the library, register the preset, and render your first component in a few
              minutes.
            </p>
            <div class="text-xs text-muted-foreground pt-1 flex gap-2 items-center">
              <Icon name="i-lucide:link" class="size-3.5" />
              <span>moraine.dev/docs/getting-started</span>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard>{' '}
      before diving into individual primitives.
    </p>
  )
}
