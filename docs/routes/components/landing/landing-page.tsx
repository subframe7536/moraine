import { Button } from '../../../../src'

import { ComponentCanvas } from './component-canvas'
import { HeroSpecimen } from './hero-specimen'
import { StylingShowcase } from './styling-showcase'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

export { ComponentCanvas } from './component-canvas'
export { HeroSpecimen } from './hero-specimen'
export { StylingShowcase, StylingSpecimen } from './styling-showcase'

export function LandingPage() {
  return (
    <div class="mx-auto px-5 max-w-6xl sm:px-8">
      <section
        aria-labelledby="landing-title"
        class="py-10 gap-8 grid items-center lg:py-20 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
      >
        <div class="min-w-0">
          <h1
            id="landing-title"
            class="text-3xl leading-tight tracking-tight font-semibold max-w-xl lg:text-5xl sm:text-4xl"
          >
            SolidJS components that fit your design system.
          </h1>
          <p class="text-sm text-muted-foreground leading-relaxed mt-4 max-w-lg sm:text-base">
            Compose forms, navigation, and overlays. Tune their variants and slots to make them
            yours.
          </p>
          <div class="mt-6 flex flex-wrap gap-3 items-center">
            <Button as="a" href="/start">
              Get started
            </Button>
            <Button as="a" href="/styling/unocss" variant="outline">
              Styling guide
            </Button>
          </div>
          <code class="text-xs text-muted-foreground font-mono mt-5 px-3 py-2 border border-border/70 rounded-md bg-muted/40 inline-block">
            pnpm add moraine
          </code>
        </div>
        <div class="min-w-0">
          <HeroSpecimen />
        </div>
      </section>
      <ComponentCanvas />
      <StylingShowcase />
      <section
        aria-labelledby="quick-start-title"
        class="py-8 border-t border-border/70 flex flex-wrap gap-4 items-center sm:py-10"
      >
        <div class="me-auto">
          <h2 id="quick-start-title" class="text-lg tracking-tight font-semibold">
            Start building
          </h2>
          <code class="text-xs text-muted-foreground font-mono mt-1 block">pnpm add moraine</code>
        </div>
        <Button as="a" href="/start" size="sm">
          Get started
        </Button>
        <a
          href="/styling/unocss"
          class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}
        >
          Styling guide →
        </a>
      </section>
    </div>
  )
}
