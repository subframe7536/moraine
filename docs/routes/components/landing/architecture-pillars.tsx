import { Kbd } from '../../../../src'

export function ArchitecturePillars() {
  return (
    <section aria-labelledby="pillars-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="mb-5 flex flex-wrap gap-2 items-baseline justify-between">
        <div>
          <h2 id="pillars-title" class="tracking-tight font-semibold text-xl sm:text-2xl">
            Engineered for SolidJS
          </h2>
          <p class="text-muted-foreground mt-1 text-sm">
            Built from first principles for fine-grained reactivity, dual CSS engines, and
            composable recipes.
          </p>
        </div>
      </div>

      <div class="border border-border/70 bg-card/40 grid grid-cols-1 overflow-hidden divide-border/70 divide-y rounded-xl lg:grid-cols-4 md:grid-cols-2 md:divide-x lg:divide-y-0">
        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-primary tracking-wider font-mono font-semibold uppercase text-xs">
              01 / Engine
            </span>
            <Kbd value="SolidJS" variant="outline" />
          </div>
          <h3 class="text-foreground font-semibold text-base">Fine-Grained Signals</h3>
          <p class="text-muted-foreground leading-relaxed text-xs">
            No virtual DOM diffing or reconcile sweeps. Signal changes trigger direct, surgical DOM
            updates while preserving focus and input states.
          </p>
        </div>

        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-primary tracking-wider font-mono font-semibold uppercase text-xs">
              02 / Structure
            </span>
            <Kbd value="Recipes" variant="outline" />
          </div>
          <h3 class="text-foreground font-semibold text-base">Layered Slots & Recipes</h3>
          <p class="text-muted-foreground leading-relaxed text-xs">
            Every component declares typed style slots and variants. Override any layer using slot
            classes without ejecting or unstyling.
          </p>
        </div>

        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-primary tracking-wider font-mono font-semibold uppercase text-xs">
              03 / Styling
            </span>
            <Kbd value="Uno & Tailwind" variant="outline" />
          </div>
          <h3 class="text-foreground font-semibold text-base">Twin-Engine Parity</h3>
          <p class="text-muted-foreground leading-relaxed text-xs">
            Full 1:1 utility, animation, and token parity between UnoCSS preset and modern Tailwind
            CSS v4 plugin integrations.
          </p>
        </div>

        <div class="p-5 space-y-2 sm:p-6">
          <div class="flex items-center justify-between">
            <span class="text-primary tracking-wider font-mono font-semibold uppercase text-xs">
              04 / Accessibility
            </span>
            <Kbd value="WAI-ARIA" variant="outline" />
          </div>
          <h3 class="text-foreground font-semibold text-base">Accessible Primitives</h3>
          <p class="text-muted-foreground leading-relaxed text-xs">
            Complete keyboard navigation, roving tabindex, portal focus trapping, and semantic
            data/ARIA attributes baked into every overlay and form.
          </p>
        </div>
      </div>
    </section>
  )
}
