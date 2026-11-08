import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, Icon, cn } from '../../../../src'
import { createCopy } from '../../../../src/utils'
import type { CopyState } from '../../../../src/utils'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.recipe'

import { ComponentRadar } from './component-radar'
import { StylingShowcase } from './styling-showcase'

const HERO_BUTTON_MOBILE_SIZE_CLASS = 'max-sm:text-sm max-sm:px-4 max-sm:h-10'

function InstallCommand(props: { state: CopyState; onClick: () => void; class?: string }) {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      class={cn(
        'group text-sm px-3.5 py-2 text-left border border-border rounded-lg bg-card inline-flex gap-2.5 cursor-pointer select-none transition-colors items-center hover:bg-muted/40',
        DOCS_FOCUS_RING_OFFSET_CLASS,
        props.class,
      )}
      aria-label="Copy install command"
      title={
        props.state === 'copied'
          ? 'Copied to clipboard'
          : props.state === 'failed'
            ? 'Copy failed; try again'
            : 'Click to copy'
      }
    >
      <span class="text-sm text-primary font-medium font-mono select-none">$</span>
      <code class="text-sm text-foreground font-mono">npm i moraine</code>
      <span class="text-muted-foreground inline-flex transition-colors items-center group-hover:text-foreground">
        <Icon
          name={props.state === 'copied' ? 'i-lucide:check' : 'i-lucide:copy'}
          class={cn('size-4 transition-colors', props.state === 'copied' && 'text-primary')}
        />
      </span>
    </button>
  )
}

export { ComponentRadar } from './component-radar'
export { StylingShowcase } from './styling-showcase'

export function LandingPage() {
  const clipboard = createCopy()
  const handleCopy = () => clipboard.copy('npm i moraine')

  return (
    <div class="mx-auto px-4 max-w-6xl lg:px-8 sm:px-6">
      <section
        aria-labelledby="landing-title"
        class="pb-16 pt-12 text-center flex flex-col items-center lg:pb-32 lg:pt-20 sm:pb-24 sm:pt-16"
      >
        <Badge
          size="lg"
          variant="outline"
          leading="i-lucide:sparkles"
          class="mb-6 px-4 border-primary/60 rounded-full bg-primary/10 gap-2 h-9"
          classes={{ leading: 'text-primary' }}
        >
          Styled & Composable for SolidJS · Pre-Alpha
        </Badge>
        <h1
          id="landing-title"
          class="text-3xl leading-tight tracking-tight font-semibold max-w-5xl min-w-0 wrap-anywhere text-balance lg:text-6xl sm:text-5xl"
        >
          <span class="text-foreground block">Styled out of the box.</span>
          <span class="text-primary block">Composable at every level.</span>
        </h1>
        <p class="text-sm text-muted-foreground leading-relaxed mt-5 max-w-2xl lg:text-lg sm:text-base sm:mt-6">
          Inspired by Nuxt UI and Chakra UI, built natively for SolidJS. Moraine ships with
          production-ready styling by default, pairing ready-to-use composite controls for rapid
          velocity with granular building blocks for complete structural freedom.
        </p>

        <div class="mt-8 flex flex-wrap gap-3 items-center justify-center">
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

        <InstallCommand state={clipboard.state()} onClick={handleCopy} class="mt-6" />
      </section>

      <StylingShowcase />
      <ComponentRadar />

      <footer>
        <div class="py-12 border-t border-border gap-10 grid sm:py-16 md:gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div class="md:pe-8">
            <h2 class="text-2xl tracking-tight font-semibold sm:text-3xl">
              Ready to build with speed and composition?
            </h2>
            <p class="text-sm text-muted-foreground leading-relaxed mt-3 max-w-md sm:text-base">
              Drop in styled composite controls or assemble custom flows from granular parts.
              Install Moraine, plug in our UnoCSS preset or Tailwind plugin, and build with complete
              freedom.
            </p>

            <InstallCommand class="mt-6" state={clipboard.state()} onClick={handleCopy} />

            <span class="sr-only" aria-live="polite">
              {clipboard.state() === 'copied'
                ? 'Install command copied'
                : clipboard.state() === 'failed'
                  ? 'Copy failed; try again'
                  : ''}
            </span>
          </div>

          <nav
            aria-label="Explore Moraine"
            class="divide-border divide-y md:ps-8 md:border-s md:border-border"
          >
            <a
              href="/components"
              class={`group py-4 flex gap-4 items-center justify-between ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
            >
              <span>
                <span class="text-sm font-medium block">Components</span>
                <span class="text-xs text-muted-foreground mt-1 block">
                  Full catalogue of styled composite controls and composable subparts.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
            <a
              href="/docs/customization"
              class={`group py-4 flex gap-4 items-center justify-between ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
            >
              <span>
                <span class="text-sm font-medium block">Customization</span>
                <span class="text-xs text-muted-foreground mt-1 block">
                  Theme tokens, compiled recipes, and fine-grained slot overrides.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
            <a
              href="/docs/unocss"
              class={`group py-4 flex gap-4 items-center justify-between ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
            >
              <span>
                <span class="text-sm font-medium block">UnoCSS</span>
                <span class="text-xs text-muted-foreground mt-1 block">
                  Zero-runtime utility preset with variant grouping.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
            <a
              href="/docs/tailwind"
              class={`group py-4 flex gap-4 items-center justify-between ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
            >
              <span>
                <span class="text-sm font-medium block">Tailwind CSS</span>
                <span class="text-xs text-muted-foreground mt-1 block">
                  First-class plugin with automatic class scanning.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
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
            class={`text-muted-foreground ms-auto flex gap-1.5 items-center hover:text-foreground ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
          >
            GitHub <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
          </a>
        </div>
      </footer>
    </div>
  )
}
