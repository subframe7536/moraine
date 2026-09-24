import { For, createSignal } from 'solid-js'

import { Badge, Button, Card, Field, Input } from '../../../../src'
import { DOCS_INLINE_CODE_CLASS } from '../markdown/markdown.class.ts'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

const PRESETS = [
  {
    name: 'Default',
    primary: 'hsl(221.2 83.2% 53.3%)',
    foreground: 'hsl(210 40% 98%)',
    radius: '0.625rem',
    variant: 'default',
    inputVariant: 'outline',
    buttonRounding: 'rounded-md',
  },
  {
    name: 'Zinc Sharp',
    primary: 'hsl(240 5.9% 10%)',
    foreground: 'hsl(0 0% 98%)',
    radius: '0px',
    variant: 'solid',
    inputVariant: 'outline',
    buttonRounding: 'rounded-none',
  },
  {
    name: 'Violet Pill',
    primary: 'hsl(262.1 83.3% 57.8%)',
    foreground: 'hsl(210 20% 98%)',
    radius: '1rem',
    variant: 'subtle',
    inputVariant: 'subtle',
    buttonRounding: 'rounded-full',
  },
  {
    name: 'Emerald Dense',
    primary: 'hsl(142.1 76.2% 36.3%)',
    foreground: 'hsl(355.7 100% 97.3%)',
    radius: '0.375rem',
    variant: 'surface',
    inputVariant: 'outline',
    buttonRounding: 'rounded-md',
  },
] as const

export function StylingShowcase() {
  const [presetIndex, setPresetIndex] = createSignal(0)
  const [customSlotOverrides, setCustomSlotOverrides] = createSignal(false)
  const [created, setCreated] = createSignal(false)

  const active = () => PRESETS[presetIndex()]!

  return (
    <section aria-labelledby="styling-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 id="styling-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Live theme
          </h2>
          <p class="text-sm text-muted-foreground mt-1 max-w-xl">
            Switch presets or toggle slot overrides; semantic tokens carry the styling across
            components.
          </p>
        </div>
        <a
          href="/styling/customization"
          class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}
        >
          Explore customization →
        </a>
      </div>

      {/* Preset Toolbar */}
      <div class="mt-5 p-3 border border-border/70 rounded-lg bg-muted/20 flex flex-wrap gap-4 items-center justify-between">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-xs text-muted-foreground font-medium me-1">Presets:</span>
          <For each={PRESETS}>
            {(p, idx) => (
              <button
                type="button"
                onClick={() => setPresetIndex(idx())}
                class={`text-xs px-3 py-1 border rounded-md flex gap-1.5 transition-all items-center ${
                  presetIndex() === idx()
                    ? 'border-primary ring-2 ring-primary/20 font-semibold bg-background text-foreground'
                    : 'border-border/70 hover:bg-background/60 text-muted-foreground'
                }`}
              >
                <span class="rounded-full size-2.5" style={{ 'background-color': p.primary }} />
                {p.name}
              </button>
            )}
          </For>
        </div>

        <div class="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setCustomSlotOverrides((v) => !v)}
            class={`text-xs px-3 py-1 border rounded-md transition-all ${
              customSlotOverrides()
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-border/70 hover:bg-background/60 text-muted-foreground'
            }`}
          >
            {customSlotOverrides() ? 'Slot overrides: Active' : 'Toggle slot overrides'}
          </button>
        </div>
      </div>

      {/* Live Preview Box */}
      <div
        class="mt-4 border border-border/70 rounded-xl bg-card grid overflow-hidden md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        style={{
          '--primary': active().primary,
          '--primary-foreground': active().foreground,
          '--ring': active().primary,
          '--radius': active().radius,
        }}
      >
        {/* Left Side: Live Rendered Specimen */}
        <div class="p-6 border-b border-border/70 space-y-4 md:border-r md:border-b-0">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">{active().name} Theme</h3>
            <Badge
              variant="surface"
              class={customSlotOverrides() ? 'uppercase tracking-wider' : undefined}
            >
              {customSlotOverrides() ? 'Layer 3 Overrides' : 'Standard Recipe'}
            </Badge>
          </div>

          <Card compact class="border-border/70 shadow-sm">
            <div class="p-1 space-y-3.5">
              <Field label="Service namespace">
                <Input
                  defaultValue="subf/moraine"
                  variant={active().inputVariant}
                  classes={customSlotOverrides() ? { root: 'font-mono text-xs' } : undefined}
                />
              </Field>

              <div class="pt-1 flex flex-wrap gap-2.5 items-center">
                <Button
                  size="sm"
                  variant="default"
                  class={active().buttonRounding}
                  classes={
                    customSlotOverrides()
                      ? { label: 'tracking-widest uppercase font-mono' }
                      : undefined
                  }
                  onClick={() => setCreated(true)}
                >
                  {created() ? 'Saved changes' : 'Save changes'}
                </Button>

                <Button size="sm" variant="outline" class={active().buttonRounding}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Code Specimen */}
        <div class="text-xs font-mono p-5 bg-muted/20 flex flex-col justify-between">
          <div class="space-y-2">
            <span class="text-[11px] text-muted-foreground tracking-wider font-sans font-semibold block uppercase">
              Reactive TSX Code
            </span>
            <pre class="text-foreground p-3 border border-border/60 rounded-lg bg-background overflow-x-auto">
              <code>{`<Button
  variant="default"
  class="${active().buttonRounding}"${
    customSlotOverrides() ? `\n  classes={{ label: 'tracking-widest uppercase font-mono' }}` : ''
  }
>
  Save changes
</Button>`}</code>
            </pre>
          </div>

          <div class="pt-3 border-t border-border/60 space-y-1">
            <span class="text-[11px] text-muted-foreground tracking-wider font-sans font-semibold block uppercase">
              CSS Tokens
            </span>
            <div class="text-muted-foreground flex flex-wrap gap-3">
              <span>
                --radius: <code class="text-foreground">{active().radius}</code>
              </span>
              <span>
                --primary: <code class="text-foreground">{active().name}</code>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Color Swatches */}
      <div class="mt-4 px-4 py-3 border border-border/70 rounded-lg bg-card/40 flex flex-wrap gap-x-6 gap-y-3 items-center sm:px-6">
        <span class="text-xs text-muted-foreground">Mapped color roles:</span>
        <div class="text-xs flex gap-2 items-center">
          <span class="border border-border rounded-sm bg-background size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>background</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="border border-border rounded-sm bg-card size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>card</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="rounded-sm bg-primary size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>primary</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="rounded-sm bg-ring size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>ring</code>
        </div>
      </div>
    </section>
  )
}
