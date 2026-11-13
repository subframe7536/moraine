import { Button, Drawer, Icon } from '@src'
import { For, createSignal } from 'solid-js'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const GOAL_BARS = [400, 300, 200, 300, 200, 278, 189, 239, 300, 200, 278, 189, 349]

export default function DrawerPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'side',
          label: 'Side',
          defaultValue: 'bottom',
          options: [
            { label: 'Bottom', value: 'bottom' },
            { label: 'Top', value: 'top' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        { kind: 'switch', prop: 'handle', label: 'Handle', defaultValue: true },
        { kind: 'switch', prop: 'closable', label: 'Closable', defaultValue: true },
        { kind: 'switch', prop: 'overlay', label: 'Overlay', defaultValue: true },
      ]}
    >
      {(props) => {
        const [goal, setGoal] = createSignal(350)
        const adjust = (delta: number) =>
          setGoal((value) => Math.min(400, Math.max(200, value + delta)))

        return (
          <Drawer
            side={props.side}
            handle={props.handle}
            closable={props.closable}
            overlay={props.overlay}
          >
            <Drawer.Trigger as={Button} variant="outline">
              Open Drawer
            </Drawer.Trigger>
            <Drawer.Content title="Move Goal" description="Set your daily activity goal.">
              <Drawer.Body class="mx-auto max-w-sm w-full">
                <div class="flex gap-2 items-center justify-center">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    class="rounded-full shrink-0"
                    aria-label="Decrease goal"
                    disabled={goal() <= 200}
                    onClick={() => adjust(-10)}
                  >
                    <Icon name="i-lucide:minus" />
                  </Button>
                  <div class="text-center flex-1">
                    <div class="text-7xl tracking-tighter font-bold">{goal()}</div>
                    <div class="text-[0.7rem] text-muted-foreground uppercase">Calories/day</div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    class="rounded-full shrink-0"
                    aria-label="Increase goal"
                    disabled={goal() >= 400}
                    onClick={() => adjust(10)}
                  >
                    <Icon name="i-lucide:plus" />
                  </Button>
                </div>
                <div class="mt-4 flex gap-1.5 h-30 items-end" aria-hidden="true">
                  <For each={GOAL_BARS}>
                    {(bar) => (
                      <div
                        class="rounded-sm bg-primary/25 flex-1"
                        style={{ height: `${(bar / 400) * 100}%` }}
                      />
                    )}
                  </For>
                </div>
              </Drawer.Body>
              <Drawer.Footer class="mx-auto max-w-sm w-full">
                <Drawer.Close as={Button}>Submit</Drawer.Close>
                <Drawer.Close as={Button} variant="outline">
                  Cancel
                </Drawer.Close>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
        )
      }}
    </DocsPlayground>
  )
}
