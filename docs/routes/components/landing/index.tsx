import { createSignal } from 'solid-js'

import packageMetadata from '../../../../package.json' with { type: 'json' }
import { Badge, Button, Icon } from '../../../../src'
import { getDocsPages } from '../../docs-route'

import { ArchitecturePillars } from './architecture-pillars'
import { ComponentRadar } from './component-radar'
import { HeroSpecimen } from './hero-specimen'
import { StylingShowcase } from './styling-showcase'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

export { ArchitecturePillars } from './architecture-pillars'
export { ComponentRadar } from './component-radar'
export { HeroSpecimen } from './hero-specimen'
export { StylingShowcase } from './styling-showcase'

export function LandingPage() {
  const [copied, setCopied] = createSignal(false)

  const componentPages = getDocsPages().filter((page) =>
    ['form', 'general', 'navigation', 'overlay'].includes(page.group ?? ''),
  )
  const componentCount = componentPages.length
  const firstComponentPath = componentPages[0]?.path ?? '/button'

  const handleCopy = () => {
    void navigator.clipboard?.writeText('npm i moraine')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="mx-auto px-5 max-w-6xl sm:px-8">
      {/* Hero Section */}
      <section
        aria-labelledby="landing-title"
        class="py-10 gap-8 grid items-center lg:py-20 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
      >
        <div class="min-w-0">
          <Badge variant="outline" class="font-mono mb-4 text-xs">
            Pre-release · v{packageMetadata.version}
          </Badge>
          <h1
            id="landing-title"
            class="leading-tight tracking-tight font-semibold max-w-xl text-3xl lg:text-5xl sm:text-4xl"
          >
            SolidJS components that fit your design system.
          </h1>
          <p class="text-muted-foreground leading-relaxed mt-4 max-w-lg text-sm sm:text-base">
            Fine-grained reactivity, composable slot recipes, and twin-engine styling via UnoCSS and
            Tailwind CSS v4. Tune every layer without ejecting.
          </p>

          <div class="mt-6 flex flex-wrap gap-3 items-center">
            <Button as="a" size="lg" href="/start" trailing="icon-arrow-right">
              Get started
            </Button>
            <Button as="a" size="lg" href={firstComponentPath} variant="outline">
              Explore {componentCount} components
            </Button>
          </div>

          {/* Quick Copy Command Pill */}
          <button
            type="button"
            onClick={handleCopy}
            class={`group mt-5 px-3 py-1 text-left border border-border/80 bg-card/90 inline-flex gap-3.5 cursor-pointer select-none transition-colors items-center text-xl rounded-lg hover:border-border hover:bg-card ${linkFocus}`}
            aria-label="Copy install command"
            title={copied() ? 'Copied to clipboard' : 'Click to copy'}
          >
            <span class="text-blue-500 font-medium font-mono select-none">$</span>
            <code class="text-foreground tracking-tight font-mono text-xs sm:text-sm">
              npm i moraine
            </code>
            <span class="text-muted-foreground ml-1 inline-flex transition-colors items-center group-hover:text-foreground">
              <Icon
                name={copied() ? 'i-lucide:check' : 'i-lucide:copy'}
                class={`size-4 transition-colors ${copied() ? 'text-primary' : ''}`}
              />
            </span>
          </button>
        </div>

        <div class="min-w-0">
          <HeroSpecimen />
        </div>
      </section>

      {/* 4 Technical Architecture Pillars */}
      <ArchitecturePillars />

      {/* Live Theme & Recipe Lab */}
      <StylingShowcase />

      {/* Components Working Together */}
      <ComponentRadar />

      {/* Quick Start Terminal */}
      <section
        aria-labelledby="quick-start-title"
        class="py-10 border-t border-border/70 flex flex-wrap gap-4 items-center sm:py-12"
      >
        <div class="me-auto">
          <h2 id="quick-start-title" class="tracking-tight font-semibold text-lg">
            Ready to build?
          </h2>
          <p class="text-muted-foreground mt-0.5 text-xs">
            Install Moraine and explore {componentCount} reactive primitives.
          </p>
        </div>
        <div class="flex gap-3 items-center">
          <Button as="a" href="/start" size="sm" trailing="icon-arrow-right">
            Get started
          </Button>
        </div>
      </section>
    </div>
  )
}
