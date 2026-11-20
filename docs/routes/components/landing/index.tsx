import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, Icon } from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'

import { ComponentRadar } from './component-radar'
import { StylingShowcase } from './styling-showcase'

const HERO_BUTTON_MOBILE_SIZE_CLASS = 'max-sm:text-sm max-sm:px-3.5 max-sm:h-11 max-sm:w-full'

export { ComponentRadar } from './component-radar'
export { StylingShowcase } from './styling-showcase'

export function LandingPage() {
  return (
    <div class="mx-auto px-4 max-w-6xl lg:px-8 sm:px-6">
      <section
        aria-labelledby="landing-title"
        class="pb-10 pt-8 text-center flex flex-col items-center lg:pb-16 lg:pt-14 sm:pb-14 sm:pt-12"
      >
        <Badge
          size="md"
          variant="outline"
          leading="i-lucide:sparkles"
          class="mb-5 px-3.5 border-primary/60 rounded-full bg-primary/10 gap-2 h-8"
          classes={{ leading: 'text-primary' }}
        >
          SolidJS Component Library · Beta
        </Badge>
        <h1
          id="landing-title"
          class="text-3xl leading-tight tracking-tight font-semibold max-w-4xl min-w-0 wrap-anywhere text-balance lg:text-6xl sm:text-5xl"
        >
          <span class="text-foreground block">Styled out of the box.</span>
          <span class="text-primary block">Composable at every level.</span>
        </h1>
        <p class="text-sm text-muted-foreground leading-relaxed mt-4 max-w-2xl lg:text-lg sm:text-base sm:mt-5">
          60 accessible SolidJS components with semantic tokens, zero-runtime recipes, and
          decomposed primitives for UnoCSS and Tailwind CSS v4.
        </p>

        <div class="mt-7 gap-2.5 grid grid-cols-2 max-w-sm w-full sm:flex sm:flex-wrap sm:gap-3 sm:max-w-none sm:w-auto sm:items-center sm:justify-center">
          <Button
            as="a"
            size="xl"
            href="/docs/getting-started"
            trailing="icon-arrow-right"
            class={HERO_BUTTON_MOBILE_SIZE_CLASS}
          >
            Start Building
          </Button>
          <Button
            as="a"
            size="xl"
            href="/components"
            variant="outline"
            class={HERO_BUTTON_MOBILE_SIZE_CLASS}
          >
            Explore Components
          </Button>
        </div>

        <p class="text-xs text-muted-foreground mt-8 flex flex-wrap gap-x-3 gap-y-1 items-center justify-center">
          <span>60 Components</span>
          <span aria-hidden="true">|</span>
          <span>UnoCSS &amp; Tailwind v4</span>
          <span aria-hidden="true">|</span>
          <span>Optional Peer Entries</span>
          <span aria-hidden="true">|</span>
          <span>SSR Safe</span>
        </p>
      </section>

      <StylingShowcase />
      <ComponentRadar />

      <footer class="mt-6 border-t border-border">
        <div class="py-10 gap-8 grid sm:py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <h2 class="text-xl tracking-tight font-semibold sm:text-2xl">
              Ready to build with Moraine?
            </h2>
            <p class="text-sm text-muted-foreground leading-relaxed mt-2 max-w-md">
              Start with styled composite controls and customize tokens, recipes, or individual
              slots whenever your design system requires it.
            </p>
            <div class="mt-5 flex flex-wrap gap-2.5">
              <Button as="a" size="sm" href="/docs/getting-started" trailing="icon-arrow-right">
                Get Started
              </Button>
              <Button as="a" size="sm" variant="outline" href="/components">
                Browse 60 Components
              </Button>
            </div>
          </div>

          <nav
            aria-label="Explore Moraine"
            class="gap-6 grid grid-cols-2 md:ps-8 md:border-s md:border-border sm:grid-cols-3"
          >
            <div>
              <h3 class="text-xs text-muted-foreground font-semibold mb-3">Docs</h3>
              <ul class="text-sm space-y-2.5">
                <li>
                  <a
                    href="/docs/getting-started"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    Getting Started
                  </a>
                </li>
                <li>
                  <a
                    href="/docs/customization"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    Customization
                  </a>
                </li>
                <li>
                  <a
                    href="/docs/unocss"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    UnoCSS
                  </a>
                </li>
                <li>
                  <a
                    href="/docs/tailwind"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    Tailwind CSS
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 class="text-xs text-muted-foreground font-semibold mb-3">Reference</h3>
              <ul class="text-sm space-y-2.5">
                <li>
                  <a
                    href="/components"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    Components
                  </a>
                </li>
                <li>
                  <a
                    href="/hooks"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    Hooks
                  </a>
                </li>
                <li>
                  <a
                    href="/components/data-table"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    DataTable
                  </a>
                </li>
                <li>
                  <a
                    href="/components/tree"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    Tree
                  </a>
                </li>
              </ul>
            </div>

            <div class="col-span-2 sm:col-span-1">
              <h3 class="text-xs text-muted-foreground font-semibold mb-3">Resources</h3>
              <ul class="text-sm space-y-2.5">
                <li>
                  <a
                    href="/llms.txt"
                    class={`text-foreground/85 hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    llms.txt
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/subframe7536/moraine"
                    target="_blank"
                    rel="noopener noreferrer"
                    class={`text-foreground/85 inline-flex gap-1 items-center hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
                  >
                    GitHub <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div class="text-xs py-5 border-t border-border flex flex-wrap gap-x-6 gap-y-3 items-center">
          <a
            href="/"
            class={`font-semibold flex gap-2 items-center ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
          >
            <img src="/favicon.svg" alt="" class="size-5" />
            Moraine
          </a>
          <span class="text-muted-foreground">v{packageMetadata.version} · MIT</span>
          <a
            href="https://github.com/subframe7536/moraine"
            target="_blank"
            rel="noopener noreferrer"
            class={`text-muted-foreground ms-auto flex gap-1.5 items-center hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
          >
            GitHub <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
          </a>
        </div>
      </footer>
    </div>
  )
}
