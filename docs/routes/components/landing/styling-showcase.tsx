import { For, createSignal } from 'solid-js'

import { Button, Card, Field, Input, cn } from '../../../../src'

const linkFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
const toolbarButtonClass = `text-xs px-3 py-1.5 border rounded-md flex gap-2 min-h-9 transition-colors items-center ${linkFocus}`
const INITIAL_NAME = 'Alex Morgan'

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
    primary: 'light-dark(#18181b, #f4f4f5)',
    foreground: 'light-dark(#fafafa, #18181b)',
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
  const [displayName, setDisplayName] = createSignal(INITIAL_NAME)
  const [savedDisplayName, setSavedDisplayName] = createSignal(INITIAL_NAME)
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
    <section aria-labelledby="styling-title" class="py-12 sm:py-16">
      <div class="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 id="styling-title" class="tracking-tight font-semibold text-2xl sm:text-3xl">
            Make the components yours
          </h2>
          <p class="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
            Change tokens globally, tune component recipes, or override a single slot when you need
            to. The same model works with UnoCSS and Tailwind CSS.
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

      <div class="mt-8">
        <div class="py-4 flex flex-wrap gap-3 items-center justify-between">
          <div
            role="group"
            aria-labelledby="theme-preset-label"
            class="flex flex-wrap gap-2 items-center"
          >
            <span id="theme-preset-label" class="text-muted-foreground font-medium me-1 text-xs">
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
            Customize button label {customSlotOverrides() ? 'on' : 'off'}
          </button>
        </div>

        <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div class="py-6 min-w-0 lg:pe-8">
            <div class="mb-4 pb-3 flex flex-wrap gap-2 items-center justify-between">
              <h3 class="font-semibold text-sm">Live preview · {active().name}</h3>
            </div>

            <form
              class="mx-auto max-w-lg w-full"
              onSubmit={(event) => {
                event.preventDefault()
                setSavedDisplayName(displayName())
                setSaved(true)
              }}
            >
              <Card class="w-full" style={cardTheme()}>
                <Card.Header>
                  <Card.Title>Profile settings</Card.Title>
                  <Card.Description>One form, four visual starting points.</Card.Description>
                </Card.Header>
                <Card.Body>
                  <Field label="Display name">
                    <Input
                      value={displayName()}
                      onValueChange={(value) => {
                        setDisplayName(value)
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
                      setDisplayName(savedDisplayName())
                      setSaved(false)
                    }}
                  >
                    Cancel
                  </Button>
                </Card.Footer>
              </Card>
            </form>
          </div>

          <div class="py-6 min-w-0 divide-border/70 divide-y lg:ps-8">
            <div class="pb-5">
              <h3 class="font-semibold text-sm">Theme</h3>
              <p class="text-muted-foreground mt-1 text-xs">
                Set shared colors, spacing, and radius.
              </p>
              <pre class="text-foreground leading-5 mt-2 p-3 border border-border/60 bg-card overflow-x-auto text-xs rounded-lg">
                <code>{cssTokens()}</code>
              </pre>
            </div>
            <div class="py-5">
              <h3 class="font-semibold text-sm">Recipe</h3>
              <p class="text-muted-foreground mt-1 text-xs">Choose a component variant.</p>
              <pre class="text-foreground leading-5 mt-2 p-3 border border-border/60 bg-card overflow-x-auto text-xs rounded-lg">
                <code>{`<Input variant="${active().inputVariant}" />`}</code>
              </pre>
            </div>
            <div class="pt-5">
              <h3 class="font-semibold text-sm">Component</h3>
              <p class="text-muted-foreground mt-1 text-xs">Change one slot for one instance.</p>
              <pre class="text-foreground leading-5 mt-2 p-3 border border-border/60 bg-card overflow-x-auto text-xs rounded-lg">
                <code>
                  {customSlotOverrides()
                    ? `<Button classes={{ label: 'tracking-widest uppercase font-mono' }} />`
                    : `<Button>Save changes</Button>`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
