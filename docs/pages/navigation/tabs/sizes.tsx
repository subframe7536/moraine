import { Tabs } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZE_OPTIONS = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="w-xl space-y-4">
      <For each={SIZE_OPTIONS}>
        {(size) => (
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground tracking-wide uppercase">{size}</p>
            <Tabs
              size={size}
              defaultValue="overview"
              items={[
                {
                  label: 'Overview',
                  value: 'overview',
                  content: <p class="text-sm text-foreground">Overview</p>,
                },
                {
                  label: 'Metrics',
                  value: 'metrics',
                  content: <p class="text-sm text-foreground">Metrics</p>,
                },
                {
                  label: 'Activity',
                  value: 'activity',
                  content: <p class="text-sm text-foreground">Activity</p>,
                },
              ]}
            />
          </div>
        )}
      </For>
    </div>
  )
}
