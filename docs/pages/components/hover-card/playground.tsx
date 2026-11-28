import { Avatar, HoverCard } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'
export default function HoverCardPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'placement',
          label: 'Placement',
          defaultValue: 'bottom',
          options: [
            { label: 'Bottom', value: 'bottom' },
            { label: 'Top', value: 'top' },
            { label: 'Right', value: 'right' },
            { label: 'Left', value: 'left' },
          ],
        },
        {
          kind: 'select',
          prop: 'align',
          label: 'Align',
          defaultValue: 'center',
          options: [
            { label: 'Start', value: 'start' },
            { label: 'Center', value: 'center' },
            { label: 'End', value: 'end' },
          ],
        },
        {
          kind: 'input',
          prop: 'openDelay',
          label: 'Open delay',
          defaultValue: 600,
          inputType: 'number',
        },
        {
          kind: 'input',
          prop: 'closeDelay',
          label: 'Close delay',
          defaultValue: 300,
          inputType: 'number',
        },
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <p class="text-sm text-foreground leading-6 max-w-xs">
          The design system grew out of the primitives that{' '}
          <HoverCard
            placement={props.placement}
            align={props.align}
            openDelay={props.openDelay}
            closeDelay={props.closeDelay}
            disabled={props.disabled}
          >
            <HoverCard.Trigger
              href="/u/alex.morgan"
              class="font-medium underline underline-offset-4"
            >
              @alex.morgan
            </HoverCard.Trigger>
            <HoverCard.Content>
              <div class="space-y-3">
                <div class="flex items-start justify-between">
                  <Avatar text="AM" alt="Alex Morgan" size="lg" />
                </div>
                <div>
                  <h4 class="text-sm font-semibold">Alex Morgan</h4>
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
          published in the component library, and the team keeps refining them as the product
          surface grows.
        </p>
      )}
    </DocsPlayground>
  )
}
