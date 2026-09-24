import { createSignal } from 'solid-js'

import { Badge, Button, Field, Input } from '../../../../src'
import { DOCS_INLINE_CODE_CLASS } from '../markdown/markdown.class.ts'

const linkFocus =
  'focus-visible:(outline-none ring-2 ring-ring ring-offset-2 ring-offset-background)'

export function StylingSpecimen(props: { customized?: boolean }) {
  const [created, setCreated] = createSignal(false)

  return (
    <div class="p-4 min-w-0 space-y-4 sm:p-6">
      <h3 class="text-sm font-semibold">{props.customized ? 'Customized' : 'Default'}</h3>
      <div class="flex gap-3 items-center">
        <Badge
          variant={props.customized ? 'surface' : 'solid'}
          class={props.customized ? 'uppercase tracking-wider' : undefined}
        >
          Ready
        </Badge>
        <span class="text-sm font-medium">New project</span>
      </div>
      <Field label="Project name">
        <Input
          defaultValue="Moraine"
          variant={props.customized ? 'subtle' : 'outline'}
          classes={props.customized ? { root: 'rounded-xl' } : undefined}
        />
      </Field>
      <Button
        size="sm"
        variant={props.customized ? 'outline' : 'default'}
        classes={props.customized ? { root: 'rounded-full', label: 'tracking-wide' } : undefined}
        onClick={() => setCreated(true)}
      >
        {created() ? 'Project created' : 'Create project'}
      </Button>
    </div>
  )
}

export function StylingShowcase() {
  return (
    <section aria-labelledby="styling-title" class="py-10 border-t border-border/70 sm:py-12">
      <div class="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 id="styling-title" class="text-xl tracking-tight font-semibold sm:text-2xl">
            Shape it your way
          </h2>
          <p class="text-sm text-muted-foreground mt-1 max-w-xl">
            Change variants and slot classes; semantic tokens carry the result across themes.
          </p>
        </div>
        <a
          href="/styling/customization"
          class={`text-sm text-primary hover:text-primary-hover ${linkFocus}`}
        >
          Explore styling →
        </a>
      </div>
      <div class="mt-5 border border-border/70 rounded-xl bg-card grid overflow-hidden md:grid-cols-2">
        <div class="border-b border-border/70 md:border-b-0 md:border-r">
          <StylingSpecimen />
        </div>
        <StylingSpecimen customized />
        <div class="text-xs text-muted-foreground font-mono px-4 py-3 border-t border-border/70 bg-muted/30 sm:px-6 md:col-span-2">
          variant="subtle" &nbsp; classes=&#123;&#123; root: 'rounded-xl' &#125;&#125;
        </div>
      </div>
      <div class="mt-4 px-4 py-3 border border-border/70 rounded-lg flex flex-wrap gap-x-6 gap-y-3 items-center sm:px-6">
        <span class="text-xs text-muted-foreground">Shared color roles</span>
        <div class="text-xs flex gap-2 items-center">
          <span class="border border-border rounded-sm bg-background size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>background</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="border border-border rounded-sm bg-card size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>card</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="rounded-sm bg-primary size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>primary</code>
        </div>
        <div class="text-xs flex gap-2 items-center">
          <span class="rounded-sm bg-ring size-4" aria-hidden="true" />
          <code class={DOCS_INLINE_CODE_CLASS}>ring</code>
        </div>
      </div>
    </section>
  )
}
