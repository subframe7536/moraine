import { Badge, Button, Card, Field, Input } from '@src'
import { For, createSignal } from 'solid-js'

const PALETTES = [
  {
    name: 'Blue',
    primary: 'hsl(221.2 83.2% 53.3%)',
    foreground: 'hsl(210 40% 98%)',
  },
  {
    name: 'Emerald',
    primary: 'hsl(142.1 76.2% 36.3%)',
    foreground: 'hsl(355.7 100% 97.3%)',
  },
  {
    name: 'Violet',
    primary: 'hsl(262.1 83.3% 57.8%)',
    foreground: 'hsl(210 20% 98%)',
  },
  {
    name: 'Rose',
    primary: 'hsl(346.8 77.2% 49.8%)',
    foreground: 'hsl(355.7 100% 97.3%)',
  },
  {
    name: 'Amber',
    primary: 'hsl(37.7 92.1% 50.2%)',
    foreground: 'hsl(20 14.3% 4.1%)',
  },
]

const RADIUS_OPTIONS = [
  { label: 'Sharp (0)', value: '0px' },
  { label: 'Subtle (0.375rem)', value: '0.375rem' },
  { label: 'Default (0.625rem)', value: '0.625rem' },
  { label: 'Pill (1rem)', value: '1rem' },
]

export function TokenExplorer() {
  const [paletteIndex, setPaletteIndex] = createSignal(0)
  const [radius, setRadius] = createSignal('0.625rem')

  const activePalette = () => PALETTES[paletteIndex()]!

  return (
    <div class="w-full space-y-4">
      <div class="pb-2 border-b border-border/70 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <span class="text-muted-foreground font-medium mb-1.5 block text-xs">Primary Hue</span>
          <div class="flex flex-wrap gap-1.5 items-center">
            <For each={PALETTES}>
              {(p, idx) => (
                <button
                  type="button"
                  onClick={() => setPaletteIndex(idx())}
                  class={`px-2.5 py-1 border flex gap-1.5 transition-all items-center text-xs rounded-md ${
                    paletteIndex() === idx()
                      ? 'border-primary ring-2 ring-primary/20 font-semibold bg-muted/60'
                      : 'border-border/70 hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <span
                    class="rounded-full size-2.5 inline-block"
                    style={{ 'background-color': p.primary }}
                  />
                  {p.name}
                </button>
              )}
            </For>
          </div>
        </div>

        <div>
          <span class="text-muted-foreground font-medium mb-1.5 block text-xs">Radius Scale</span>
          <div class="flex flex-wrap gap-1.5 items-center">
            <For each={RADIUS_OPTIONS}>
              {(opt) => (
                <Button
                  size="sm"
                  variant={radius() === opt.value ? 'default' : 'outline'}
                  onClick={() => setRadius(opt.value)}
                >
                  {opt.label}
                </Button>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Scoped CSS Variables Container */}
      <div
        class="p-5 border border-border/70 bg-card/40 transition-all rounded-xl sm:p-6"
        style={{
          '--primary': activePalette().primary,
          '--primary-foreground': activePalette().foreground,
          '--ring': activePalette().primary,
          '--radius': radius(),
        }}
      >
        <div class="gap-5 grid items-start md:grid-cols-2">
          <Card size="sm" class="shadow-sm">
            <Card.Header>
              <Card.Title>Scoped Card</Card.Title>
              <Card.Description>
                Inherits active primary color and radius multipliers
              </Card.Description>
              <Card.Action>
                <Badge variant="surface">Active</Badge>
              </Card.Action>
            </Card.Header>
            <Card.Body class="pt-1 space-y-3">
              <Field label="Project name">
                <Input defaultValue="Moraine Design System" />
              </Field>
              <div class="pt-2 flex flex-wrap gap-2">
                <Button size="sm">Save changes</Button>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </Card.Body>
          </Card>

          <div class="p-4 border border-border/60 bg-background space-y-3 rounded-lg">
            <h4 class="text-muted-foreground tracking-wider font-mono font-semibold uppercase text-xs">
              Generated CSS Variables
            </h4>
            <pre class="text-foreground font-mono p-3 border border-border/50 bg-muted/40 overflow-x-auto text-xs rounded-md">
              <code>{`:root {
  --primary: ${activePalette().primary};
  --primary-foreground: ${activePalette().foreground};
  --radius: ${radius()};
}`}</code>
            </pre>
            <p class="text-muted-foreground text-xs">
              Components automatically compute derived radiuses (`rounded-xs` through `rounded-4xl`)
              and interaction states (`--primary-hover`, `--primary-active`).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
