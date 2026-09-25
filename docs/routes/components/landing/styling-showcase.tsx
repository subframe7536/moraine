import { For, createSignal } from 'solid-js'

import { Badge, Button, Card, Field, Input, cn } from '../../../../src'

const linkFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
const toolbarButtonClass = `text-xs px-3 py-1.5 border rounded-md flex gap-2 min-h-9 transition-colors items-center ${linkFocus}`
const INITIAL_NAMESPACE = 'subf/moraine'

const PRESETS = [
  {
    name: 'Default',
    primary: 'hsl(221.2 83.2% 53.3%)',
    foreground: 'hsl(210 40% 98%)',
    radius: '0.625rem',
    spacing: '0.25rem',
    fontSize: '1rem',
    inputVariant: 'outline',
  },
  {
    name: 'Zinc Sharp',
    primary: 'hsl(240 5.9% 10%)',
    foreground: 'hsl(0 0% 98%)',
    radius: '0px',
    spacing: '0.2rem',
    fontSize: '1rem',
    inputVariant: 'outline',
  },
  {
    name: 'Violet Pill',
    primary: 'hsl(262.1 83.3% 57.8%)',
    foreground: 'hsl(210 20% 98%)',
    radius: '1rem',
    spacing: '0.3125rem',
    fontSize: '1.0625rem',
    inputVariant: 'subtle',
  },
  {
    name: 'Emerald Dense',
    primary: 'hsl(142.1 76.2% 36.3%)',
    foreground: 'hsl(355.7 100% 97.3%)',
    radius: '0.375rem',
    spacing: '0.21875rem',
    fontSize: '0.9375rem',
    inputVariant: 'outline',
  },
] as const

export function StylingShowcase() {
  const [presetIndex, setPresetIndex] = createSignal(0)
  const [customSlotOverrides, setCustomSlotOverrides] = createSignal(false)
  const [namespace, setNamespace] = createSignal(INITIAL_NAMESPACE)
  const [savedNamespace, setSavedNamespace] = createSignal(INITIAL_NAMESPACE)
  const [saved, setSaved] = createSignal(false)

  const active = () => PRESETS[presetIndex()]!
  const cardTheme = () => {
    const preset = active()
    return {
      '--primary': preset.primary,
      '--primary-foreground': preset.foreground,
      '--primary-hover': `color-mix(in oklab, ${preset.primary}, black 8%)`,
      '--primary-active': `color-mix(in oklab, ${preset.primary}, black 15%)`,
      '--ring': preset.primary,
      '--radius': preset.radius,
      '--spacing': preset.spacing,
      '--font-size': preset.fontSize,
    }
  }
  const cssTokens = () =>
    Object.entries(cardTheme())
      .filter(([name]) => name !== '--primary-hover' && name !== '--primary-active')
      .map(([name, value]) => `${name}: ${value};`)
      .join('\n')

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
        <Button
          as="a"
          href="/styling/customization"
          size="sm"
          variant="link"
          trailing="icon-arrow-right"
        >
          Explore customization
        </Button>
      </div>

      <div class="mt-5 border border-border/70 rounded-xl bg-card overflow-hidden">
        <div class="px-4 py-3 border-b border-border/70 flex flex-wrap gap-3 items-center justify-between sm:px-5">
          <div
            role="group"
            aria-labelledby="theme-preset-label"
            class="flex flex-wrap gap-2 items-center"
          >
            <span id="theme-preset-label" class="text-xs text-muted-foreground font-medium me-1">
              Presets
            </span>
            <For each={PRESETS}>
              {(p, idx) => (
                <button
                  type="button"
                  aria-pressed={presetIndex() === idx()}
                  onClick={() => setPresetIndex(idx())}
                  class={cn(
                    toolbarButtonClass,
                    presetIndex() === idx()
                      ? 'text-foreground'
                      : 'text-muted-foreground border-border/70 hover:bg-muted/50',
                  )}
                  style={{
                    'border-color': presetIndex() === idx() ? p.primary : undefined,
                    'background-color':
                      presetIndex() === idx()
                        ? `color-mix(in oklab, ${p.primary} 10%, transparent)`
                        : undefined,
                  }}
                >
                  <span
                    class="rounded-full shrink-0 size-2.5"
                    style={{ 'background-color': p.primary }}
                    aria-hidden="true"
                  />
                  {p.name}
                </button>
              )}
            </For>
          </div>

          <button
            type="button"
            aria-pressed={customSlotOverrides()}
            onClick={() => setCustomSlotOverrides((v) => !v)}
            class={cn(
              toolbarButtonClass,
              customSlotOverrides()
                ? 'text-foreground font-semibold border-primary bg-primary/10'
                : 'text-muted-foreground border-border/70 hover:bg-muted/50',
            )}
          >
            Slot overrides {customSlotOverrides() ? 'on' : 'off'}
          </button>
        </div>

        <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div class="p-5 border-b border-border/70 bg-muted/10 min-w-0 sm:p-6 lg:border-r lg:border-b-0">
            <div class="mb-4 flex flex-wrap gap-2 items-center justify-between">
              <h3 class="text-sm font-semibold">{active().name} theme</h3>
              <Badge variant="surface">
                {customSlotOverrides() ? 'Slot overrides' : 'Standard recipe'}
              </Badge>
            </div>

            <form
              class="mx-auto max-w-lg w-full"
              onSubmit={(event) => {
                event.preventDefault()
                setSavedNamespace(namespace())
                setSaved(true)
              }}
            >
              <Card class="w-full" style={cardTheme()}>
                <Card.Header>
                  <Card.Title>Workspace settings</Card.Title>
                  <Card.Description>Preview a themed form with local state.</Card.Description>
                </Card.Header>
                <Card.Body>
                  <Field label="Service namespace">
                    <Input
                      value={namespace()}
                      onValueChange={(value) => {
                        setNamespace(value)
                        setSaved(false)
                      }}
                      variant={active().inputVariant}
                      classes={customSlotOverrides() ? { root: 'font-mono text-xs' } : undefined}
                    />
                  </Field>
                </Card.Body>
                <Card.Footer class="flex-wrap gap-2">
                  <Button
                    type="submit"
                    aria-live="polite"
                    size="sm"
                    variant="default"
                    classes={
                      customSlotOverrides()
                        ? { label: 'tracking-widest uppercase font-mono' }
                        : undefined
                    }
                  >
                    {saved() ? 'Saved locally' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNamespace(savedNamespace())
                      setSaved(false)
                    }}
                  >
                    Cancel
                  </Button>
                </Card.Footer>
              </Card>
            </form>
          </div>

          <div class="p-5 bg-muted/20 min-w-0 sm:p-6">
            <h3 class="text-xs text-muted-foreground tracking-wide font-semibold uppercase">
              Button TSX
            </h3>
            <pre class="text-xs text-foreground leading-5 mt-3 p-4 border border-border/60 rounded-lg bg-card overflow-x-auto">
              <code>{`<Button
  variant="default"${
    customSlotOverrides() ? `\n  classes={{ label: 'tracking-widest uppercase font-mono' }}` : ''
  }
>
  Save changes
</Button>`}</code>
            </pre>

            <div class="mt-5 pt-4 border-t border-border/60">
              <h4 class="text-xs text-muted-foreground tracking-wide font-semibold uppercase">
                CSS tokens
              </h4>
              <pre class="text-xs text-foreground leading-5 mt-3 p-4 border border-border/60 rounded-lg bg-card overflow-x-auto">
                <code>{cssTokens()}</code>
              </pre>
            </div>
          </div>
        </div>

        <div class="px-5 py-3 border-t border-border/70 flex flex-wrap gap-x-6 gap-y-3 items-center">
          <span class="text-xs text-muted-foreground font-medium">Mapped color roles</span>
          <div class="text-xs flex gap-2 items-center">
            <span class="border border-border rounded-sm bg-background size-4" aria-hidden="true" />
            <code>background</code>
          </div>
          <div class="text-xs flex gap-2 items-center">
            <span class="border border-border rounded-sm bg-card size-4" aria-hidden="true" />
            <code>card</code>
          </div>
          <div class="text-xs flex gap-2 items-center">
            <span
              class="rounded-sm size-4"
              style={{ 'background-color': active().primary }}
              aria-hidden="true"
            />
            <code>primary</code>
          </div>
          <div class="text-xs flex gap-2 items-center">
            <span
              class="rounded-sm size-4"
              style={{ 'background-color': active().primary }}
              aria-hidden="true"
            />
            <code>ring</code>
          </div>
        </div>
      </div>
    </section>
  )
}
