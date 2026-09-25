import { Badge, Button, Card, Select } from '@src'
import { createSignal, Show } from 'solid-js'

const ANIMATION_OPTIONS = [
  {
    label: 'Enter (Fade + Slide)',
    value: 'animate-mo-enter enter-opacity-0 enter-translate-y-4',
    description: 'Subtle slide up and fade in, standard for popovers and dropdowns.',
  },
  {
    label: 'Enter (Scale + Fade)',
    value: 'animate-mo-enter enter-opacity-0 enter-scale-90',
    description: 'Scales up from 90% with ease-out, ideal for dialogs and modals.',
  },
  {
    label: 'Enter (Rotate + Scale)',
    value: 'animate-mo-enter enter-opacity-0 enter-scale-75 enter-rotate-12',
    description: 'Playful entry with rotation and scaling.',
  },
  {
    label: 'Accordion Down',
    value: 'animate-accordion-down overflow-hidden',
    description: 'Animates height from 0 to var(--mo-collapsible-content-height).',
  },
  {
    label: 'Loop: Elastic',
    value: 'animate-elastic',
    description: 'Continuous horizontal elastic stretch indicator.',
  },
  {
    label: 'Loop: Swing',
    value: 'animate-swing',
    description: 'Oscillating swing motion for indeterminate progress indicators.',
  },
  {
    label: 'Loop: Carousel',
    value: 'animate-carousel',
    description: 'Continuous sliding translation across the full container width.',
  },
  {
    label: 'Spin',
    value: 'animate-spin',
    description: 'Linear 360-degree rotation for loading indicators.',
  },
]

export function AnimationExplorer() {
  const [selected, setSelected] = createSignal(ANIMATION_OPTIONS[0]!.value)
  const [speed, setSpeed] = createSignal('250ms')
  const [key, setKey] = createSignal(0)

  const replay = () => {
    setKey((prev) => prev + 1)
  }

  const currentOption = () =>
    ANIMATION_OPTIONS.find((opt) => opt.value === selected()) ?? ANIMATION_OPTIONS[0]!

  return (
    <div class="w-full space-y-4">
      <div class="flex flex-wrap gap-3 items-end justify-between">
        <div class="flex-1 min-w-48">
          <label class="text-xs text-muted-foreground font-medium mb-1 block">
            Select Animation Utility
          </label>
          <Select
            items={ANIMATION_OPTIONS.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
            value={selected()}
            onValueChange={(val) => {
              if (val) {
                setSelected(val)
                replay()
              }
            }}
          />
        </div>
        <div class="flex gap-2 items-center">
          <Button
            size="sm"
            variant={speed() === '100ms' ? 'default' : 'outline'}
            onClick={() => {
              setSpeed('100ms')
              replay()
            }}
          >
            Fast (100ms)
          </Button>
          <Button
            size="sm"
            variant={speed() === '250ms' ? 'default' : 'outline'}
            onClick={() => {
              setSpeed('250ms')
              replay()
            }}
          >
            Normal (250ms)
          </Button>
          <Button
            size="sm"
            variant={speed() === '700ms' ? 'default' : 'outline'}
            onClick={() => {
              setSpeed('700ms')
              replay()
            }}
          >
            Slow (700ms)
          </Button>
          <Button size="sm" variant="outline" onClick={replay}>
            Replay
          </Button>
        </div>
      </div>

      <p class="text-xs text-muted-foreground">{currentOption().description}</p>

      <div
        class="p-8 border border-border/70 rounded-xl bg-muted/20 flex min-h-48 items-center justify-center overflow-hidden"
        style={{ '--mo-anim-duration': speed(), '--mo-collapsible-content-height': '72px' }}
      >
        <div class="flex items-center justify-center">
          <Show when={key() >= 0}>
            <Card
              size="sm"
              class={`border-primary/30 shadow-md ${selected()}`}
              classes={{ root: 'max-w-xs w-64' }}
            >
              <Card.Body class="p-3 flex gap-3 items-center">
                <span class="text-sm text-primary font-semibold rounded-lg bg-primary/10 flex size-8 items-center justify-center">
                  M
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm leading-none font-medium truncate">Moraine Motion</p>
                  <p class="text-xs text-muted-foreground mt-1 truncate">{speed()} duration</p>
                </div>
                <Badge variant="surface" size="sm">
                  Active
                </Badge>
              </Card.Body>
            </Card>
          </Show>
        </div>
      </div>
    </div>
  )
}
