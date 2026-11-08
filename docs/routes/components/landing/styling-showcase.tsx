import { For, createSignal } from 'solid-js'

import { Button, Card, Field, Input, Switch, cn } from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'

const toolbarButtonClass = `text-xs px-3 py-1.5 border rounded-md flex gap-2 min-h-9 transition-colors items-center ${DOCS_FOCUS_RING_OFFSET_CLASS}`
const INITIAL_NAME = 'Sam Rivera'

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
      '--ring': preset.primary,
      '--radius': preset.radius,
      '--spacing': preset.spacing,
      '--font-size': preset.fontSize,
    }
  }
  const cssTokens = () =>
    Object.entries(cardTheme())
      .map(([name, value]) => `${name}: ${value};`)
      .join('\n')

  return (
    <section aria-labelledby="styling-title" class="py-12 sm:py-16">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="max-w-2xl">
          <h2 id="styling-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Styled by default. Customized in three tiers.
          </h2>
          <p class="text-sm text-muted-foreground mt-2 sm:text-base">
            Every component ships with cohesive, accessible styling out of the box. When your brand
            demands customization, shape tokens globally, switch recipe variants, or surgically
            override individual slots without fighting CSS specificity.
          </p>
        </div>
        <Button
          as="a"
          href="/docs/customization"
          size="sm"
          variant="link"
          trailing="icon-arrow-right"
          class="shrink-0 self-start sm:self-end"
        >
          Explore the styling model
        </Button>
      </div>

      <div class="mt-8">
        <div class="py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-labelledby="theme-preset-label"
            class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-2 sm:items-center"
          >
            <span id="theme-preset-label" class="text-xs text-muted-foreground font-medium sm:me-1">
              Presets
            </span>
            <div class="gap-2 grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center">
              <For each={PRESETS}>
                {(p, idx) => (
                  <button
                    type="button"
                    aria-pressed={presetIndex() === idx()}
                    onClick={() => setPresetIndex(idx())}
                    class={cn(
                      toolbarButtonClass,
                      'justify-center sm:justify-start',
                      presetIndex() === idx()
                        ? 'text-foreground bg-accent'
                        : 'text-muted-foreground border-border hover:bg-muted/50',
                    )}
                    style={{
                      'border-color': presetIndex() === idx() ? p.primary : undefined,
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
          </div>

          <Switch
            label="Inject slot override (classes.label)"
            checked={customSlotOverrides()}
            onCheckedChange={setCustomSlotOverrides}
            class="flex shrink-0 min-h-9 items-center"
          />
        </div>

        <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div class="pb-6 pt-4 min-w-0 lg:py-6 lg:pe-8">
            <h3 class="text-sm font-semibold mb-4">Live preview · {active().name}</h3>

            <form
              class="max-w-xl w-full"
              onSubmit={(event) => {
                event.preventDefault()
                setSavedDisplayName(displayName())
                setSaved(true)
              }}
            >
              <Card class="w-full" style={cardTheme()}>
                <Card.Header>
                  <Card.Title>Profile settings</Card.Title>
                  <Card.Description>
                    A styled composite form adapting instantly across tokens and recipe variants.
                  </Card.Description>
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

          <div class="py-6 border-t border-border min-w-0 lg:ps-8 lg:border-s lg:border-t-0">
            <div class="pb-4">
              <h3 class="text-sm font-semibold">1. Design Tokens</h3>
              <p class="text-xs text-muted-foreground mt-1">
                Global CSS custom properties driving default typography, radii, and theme colors.
              </p>
              <pre class="text-xs text-foreground leading-5 mt-2 p-2.5 border border-border/60 rounded-lg bg-card overflow-x-auto">
                <code>{cssTokens()}</code>
              </pre>
            </div>
            <div class="py-4">
              <h3 class="text-sm font-semibold">2. Component Recipe</h3>
              <p class="text-xs text-muted-foreground mt-1">
                Pre-compiled variants matching deterministically into fine-grained reactive memos.
              </p>
              <pre class="text-xs text-foreground leading-5 mt-2 p-2.5 border border-border/60 rounded-lg bg-card overflow-x-auto">
                <code>{`<Input variant="${active().inputVariant}" />`}</code>
              </pre>
            </div>
            <div class="pt-4">
              <h3 class="text-sm font-semibold">3. Slot Overrides</h3>
              <p class="text-xs text-muted-foreground mt-1">
                Surgically target internal component slots with bespoke classes or inline styles.
              </p>
              <pre class="text-xs text-foreground leading-5 mt-2 p-2.5 border border-border/60 rounded-lg bg-card overflow-x-auto">
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
