import { Kbd } from '../../../../src'

export function ArchitecturePillars() {
  return (
    <section aria-labelledby="pillars-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="mb-5 flex flex-wrap gap-2 items-baseline justify-between">
        <div>
          <h2 id="pillars-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Engineered for SolidJS
          </h2>
          <p class="text-sm text-muted-foreground mt-1">
            Built from first principles for fine-grained reactivity, dual CSS engines, and
            composable recipes.
          </p>
        </div>
      </div>

      <div class="border border-border/70 rounded-xl bg-card/40 grid grid-cols-1 overflow-hidden divide-border/70 divide-y lg:grid-cols-4 md:grid-cols-2 md:divide-x lg:divide-y-0">
        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-xs text-primary tracking-wider font-mono font-semibold uppercase">
              01 / Engine
            </span>
            <Kbd value="SolidJS" variant="outline" />
          </div>
          <h3 class="text-base text-foreground font-semibold">Fine-Grained Signals</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            No virtual DOM diffing or reconcile sweeps. Signal changes trigger direct, surgical DOM
            updates while preserving focus and input states.
          </p>
        </div>

        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-xs text-primary tracking-wider font-mono font-semibold uppercase">
              02 / Structure
            </span>
            <Kbd value="Recipes" variant="outline" />
          </div>
          <h3 class="text-base text-foreground font-semibold">Layered Slots & Recipes</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Every component declares typed style slots and variants. Override any layer using slot
            classes without ejecting or unstyling.
          </p>
        </div>

        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-xs text-primary tracking-wider font-mono font-semibold uppercase">
              03 / Styling
            </span>
            <Kbd value="Uno & Tailwind" variant="outline" />
          </div>
          <h3 class="text-base text-foreground font-semibold">Twin-Engine Parity</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Full 1:1 utility, animation, and token parity between UnoCSS preset and modern Tailwind
            CSS v4 plugin integrations.
          </p>
        </div>

        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-xs text-primary tracking-wider font-mono font-semibold uppercase">
              04 / Accessibility
            </span>
            <Kbd value="WAI-ARIA" variant="outline" />
          </div>
          <h3 class="text-base text-foreground font-semibold">Accessible Primitives</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Complete keyboard navigation, roving tabindex, portal focus trapping, and semantic
            data/ARIA attributes baked into every overlay and form.
          </p>
        </div>
      </div>
    </section>
  )
}
