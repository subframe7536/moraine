import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, Icon, cn } from '../../../../src'
import { DOCS_FOCUS_RING_OFFSET_CLASS } from '../../../shared/docs-focus.class'
import { createClipboardCopy } from '../../hooks/create-clipboard-copy'
import type { ClipboardCopyState } from '../../hooks/create-clipboard-copy'

import { ComponentRadar } from './component-radar'
import { StylingShowcase } from './styling-showcase'

function InstallCommand(props: { state: ClipboardCopyState; onClick: () => void; class?: string }) {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      class={cn(
        'group text-lg px-4 py-2 text-left border border-border rounded-lg bg-card inline-flex gap-3 cursor-pointer select-none transition-colors items-center hover:bg-muted/40',
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
      <span class="text-primary font-medium font-mono select-none">$</span>
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
  const clipboard = createClipboardCopy()
  const handleCopy = () => clipboard.copy('npm i moraine')

  return (
    <div class="mx-auto px-5 max-w-6xl sm:px-8">
      <section
        aria-labelledby="landing-title"
        class="py-16 text-center flex flex-col items-center lg:py-28 sm:py-24"
      >
        <Badge
          size="lg"
          variant="outline"
          leading="i-lucide:sparkles"
          class="mb-6 px-4 border-primary/60 rounded-full bg-primary/10 gap-2 h-9"
          classes={{ leading: 'text-primary' }}
        >
          Now in early preview
        </Badge>
        <h1
          id="landing-title"
          class="text-3xl leading-tight tracking-tight font-semibold max-w-5xl lg:text-6xl sm:text-5xl"
        >
          <span class="text-foreground block">Styled SolidJS components.</span>
          <span class="text-primary block">Built to fit your design system.</span>
        </h1>
        <p class="text-base text-muted-foreground leading-relaxed mt-6 max-w-3xl sm:text-lg">
          Start with accessible components and built-in styles. Set a shared theme, choose component
          variants, or refine individual parts with UnoCSS or Tailwind CSS.
        </p>

        <div class="mt-8 flex flex-wrap gap-3 items-center justify-center">
          <Button as="a" size="xl" href="/docs/getting-started" trailing="icon-arrow-right">
            Get started
          </Button>
          <Button as="a" size="xl" href="/components" variant="outline">
            Browse components
          </Button>
        </div>

        <InstallCommand state={clipboard.state()} onClick={handleCopy} class="mt-6" />
      </section>

      <StylingShowcase />
      <ComponentRadar />

      <footer>
        <div class="py-14 gap-12 grid sm:py-18 md:gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div class="md:pe-8">
            <h2 class="text-2xl tracking-tight font-semibold sm:text-3xl">
              Start building with Moraine
            </h2>
            <p class="text-sm text-muted-foreground leading-relaxed mt-3 max-w-md sm:text-base">
              Install the library, choose UnoCSS or Tailwind CSS, and shape the components to fit
              your interface.
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

          <nav aria-label="Explore Moraine" class="md:ps-8">
            <a
              href="/components"
              class={`group py-4 flex gap-4 items-center justify-between ${DOCS_FOCUS_RING_OFFSET_CLASS}`}
            >
              <span>
                <span class="text-sm font-medium block">Components</span>
                <span class="text-xs text-muted-foreground mt-1 block">
                  Form, navigation, overlay, and more.
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
                  Theme, composition, and component slots.
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
                  Configure the Moraine preset.
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
                  Add the plugin and scan component styles.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
          </nav>
        </div>

        <div class="text-xs py-5 flex flex-wrap gap-x-6 gap-y-3 items-center">
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
