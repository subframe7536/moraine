import { createSignal } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, Icon, cn } from '../../../../src'

import { ComponentRadar } from './component-radar'
import { StylingShowcase } from './styling-showcase'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

function InstallCommand(props: { copied: boolean; onClick: () => void; class?: string }) {
  return (
    <button
      type="button"
      onClick={() => props.onClick()}
      class={cn(
        'group px-4 py-2 text-left text-lg border border-border bg-card inline-flex gap-3 cursor-pointer select-none transition-colors items-center rounded-lg hover:bg-muted/40',
        linkFocus,
        props.class,
      )}
      aria-label="Copy install command"
      title={props.copied ? 'Copied to clipboard' : 'Click to copy'}
    >
      <span class="text-primary font-medium font-mono select-none">$</span>
      <code class="text-foreground font-mono text-sm">npm i moraine</code>
      <span class="text-muted-foreground inline-flex transition-colors items-center group-hover:text-foreground">
        <Icon
          name={props.copied ? 'i-lucide:check' : 'i-lucide:copy'}
          class={cn('size-4 transition-colors', props.copied && 'text-primary')}
        />
      </span>
    </button>
  )
}

export { ComponentRadar } from './component-radar'
export { StylingShowcase } from './styling-showcase'

export function LandingPage() {
  const [copied, setCopied] = createSignal(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('npm i moraine')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

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
          class="leading-tight tracking-tight font-semibold max-w-5xl text-3xl lg:text-6xl sm:text-5xl"
        >
          <span class="text-foreground block">Styled SolidJS components.</span>
          <span class="text-primary block">Built to fit your design system.</span>
        </h1>
        <p class="text-muted-foreground leading-relaxed mt-6 max-w-3xl text-base sm:text-lg">
          Start with accessible components and built-in styles. Set a shared theme, choose component
          variants, or refine individual parts with UnoCSS or Tailwind CSS.
        </p>

        <div class="mt-8 flex flex-wrap gap-3 items-center justify-center">
          <Button as="a" size="xl" href="/start" trailing="icon-arrow-right">
            Get started
          </Button>
          <Button as="a" size="xl" href="/button" variant="outline">
            Browse components
          </Button>
        </div>

        <InstallCommand copied={copied()} onClick={handleCopy} class="mt-6" />
      </section>

      <StylingShowcase />
      <ComponentRadar />

      <footer>
        <div class="py-14 gap-12 grid sm:py-18 md:gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div class="md:pe-8">
            <h2 class="tracking-tight font-semibold text-2xl sm:text-3xl">
              Start building with Moraine
            </h2>
            <p class="text-muted-foreground leading-relaxed mt-3 max-w-md text-sm sm:text-base">
              Install the library, choose UnoCSS or Tailwind CSS, and shape the components to fit
              your interface.
            </p>

            <InstallCommand class="mt-6" copied={copied()} onClick={handleCopy} />

            <span class="sr-only" aria-live="polite">
              {copied() ? 'Install command copied' : ''}
            </span>
          </div>

          <nav aria-label="Explore Moraine" class="md:ps-8">
            <a
              href="/form"
              class={`group py-4 flex gap-4 items-center justify-between ${linkFocus}`}
            >
              <span>
                <span class="font-medium block text-sm">Components</span>
                <span class="text-muted-foreground mt-1 block text-xs">
                  Forms, navigation, overlays, and more.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
            <a
              href="/styling/customization"
              class={`group py-4 flex gap-4 items-center justify-between ${linkFocus}`}
            >
              <span>
                <span class="font-medium block text-sm">Customization</span>
                <span class="text-muted-foreground mt-1 block text-xs">
                  Themes, recipes, and component slots.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
            <a
              href="/styling/unocss"
              class={`group py-4 flex gap-4 items-center justify-between ${linkFocus}`}
            >
              <span>
                <span class="font-medium block text-sm">UnoCSS</span>
                <span class="text-muted-foreground mt-1 block text-xs">
                  Configure the Moraine preset.
                </span>
              </span>
              <Icon
                name="i-lucide:arrow-up-right"
                class="text-muted-foreground size-4 group-hover:text-foreground"
              />
            </a>
            <a
              href="/styling/tailwind"
              class={`group py-4 flex gap-4 items-center justify-between ${linkFocus}`}
            >
              <span>
                <span class="font-medium block text-sm">Tailwind CSS</span>
                <span class="text-muted-foreground mt-1 block text-xs">
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

        <div class="py-5 flex flex-wrap gap-x-6 gap-y-3 items-center text-xs">
          <a href="/" class={`font-semibold flex gap-2 items-center ${linkFocus}`}>
            <img src="/favicon.svg" alt="" class="size-5" />
            Moraine
          </a>
          <span class="text-muted-foreground">v{packageMetadata.version} pre-release · MIT</span>
          <a
            href="https://github.com/subframe7536/moraine"
            class={`text-muted-foreground ms-auto flex gap-1.5 items-center hover:text-foreground ${linkFocus}`}
          >
            GitHub <Icon name="i-lucide:arrow-up-right" class="size-3.5" />
          </a>
        </div>
      </footer>
    </div>
  )
}
