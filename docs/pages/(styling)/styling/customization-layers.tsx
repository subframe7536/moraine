import { Badge, Button, Checkbox, MoraineProvider } from '@src'
import { defineTheme } from '@src/theme'
import { createSignal } from 'solid-js'

const brandTheme = defineTheme({
  button: {
    base: {
      root: 'font-semibold tracking-wide ring-offset-2',
      label: 'uppercase text-xs',
    },
    defaultVariants: {
      size: 'sm',
    },
  },
})

export function CustomizationLayers() {
  const [useTheme, setUseTheme] = createSignal(false)
  const [useInstanceClasses, setUseInstanceClasses] = createSignal(true)
  const [useDirectClass, setUseDirectClass] = createSignal(false)

  return (
    <div class="w-full space-y-4">
      <div class="p-4 border border-border/70 rounded-xl bg-muted/20 space-y-3">
        <h4 class="text-xs text-muted-foreground tracking-wider font-semibold uppercase">
          Toggle Override Layers
        </h4>
        <div class="flex flex-wrap gap-4 items-center">
          <Checkbox
            label="Layer 2: MoraineProvider Theme"
            checked={useTheme()}
            onCheckedChange={setUseTheme}
          />
          <Checkbox
            label="Layer 3: Instance classes={{ label: '...' }}"
            checked={useInstanceClasses()}
            onCheckedChange={setUseInstanceClasses}
          />
          <Checkbox
            label="Layer 4: Direct class on element"
            checked={useDirectClass()}
            onCheckedChange={setUseDirectClass}
          />
        </div>
      </div>

      <div class="p-6 border border-border/70 rounded-xl bg-card flex flex-col gap-6 items-center justify-between md:flex-row">
        <div class="flex-1 space-y-2">
          <p class="text-sm font-medium">Resulting Component</p>
          <p class="text-xs text-muted-foreground">
            Classes merge deterministically via Moraine's recipe resolver:
          </p>

          <div class="pt-2">
            <MoraineProvider theme={useTheme() ? brandTheme : undefined}>
              <Button
                variant="outline"
                class={
                  useDirectClass()
                    ? 'border-primary shadow-md bg-primary/5 text-primary'
                    : undefined
                }
                classes={
                  useInstanceClasses()
                    ? {
                        root: 'rounded-full px-5',
                        label: 'font-mono text-primary',
                      }
                    : undefined
                }
              >
                Interactive Button
              </Button>
            </MoraineProvider>
          </div>
        </div>

        <div class="text-xs font-mono p-3 border border-border/50 rounded-lg bg-muted/40 w-full space-y-1.5 md:w-80">
          <div class="text-muted-foreground">Active Precedence:</div>
          <div class="text-foreground flex gap-1.5 items-center">
            <Badge size="sm" variant="outline">
              1
            </Badge>
            <span>Base Recipe</span>
          </div>
          <div
            class={`flex gap-1.5 items-center ${useTheme() ? 'text-primary font-semibold' : 'text-muted-foreground/50'}`}
          >
            <Badge size="sm" variant={useTheme() ? 'surface' : 'outline'}>
              2
            </Badge>
            <span>Theme Layer {useTheme() ? '(Applied)' : '(Inactive)'}</span>
          </div>
          <div
            class={`flex gap-1.5 items-center ${useInstanceClasses() ? 'text-primary font-semibold' : 'text-muted-foreground/50'}`}
          >
            <Badge size="sm" variant={useInstanceClasses() ? 'surface' : 'outline'}>
              3
            </Badge>
            <span>Instance `classes` {useInstanceClasses() ? '(Applied)' : '(Inactive)'}</span>
          </div>
          <div
            class={`flex gap-1.5 items-center ${useDirectClass() ? 'text-primary font-semibold' : 'text-muted-foreground/50'}`}
          >
            <Badge size="sm" variant={useDirectClass() ? 'surface' : 'outline'}>
              4
            </Badge>
            <span>Direct `class` {useDirectClass() ? '(Applied)' : '(Inactive)'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
