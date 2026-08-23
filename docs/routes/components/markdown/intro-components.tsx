import { For, createSignal } from 'solid-js'
import apiIndex from 'virtual:api-doc'

import { Badge, Button, Checkbox, Dialog, Tabs } from '../../../../src/index.ts'

const COMPONENT_CATEGORY_LABELS = new Map<string, string>([
  ['elements', 'Elements'],
  ['forms', 'Forms'],
  ['navigation', 'Navigation'],
  ['overlays', 'Overlays'],
])

function getIntroComponentGroups() {
  const groups = new Map<string, typeof apiIndex.components>()

  for (const component of apiIndex.components) {
    const components = groups.get(component.category) ?? []
    components.push(component)
    groups.set(component.category, components)
  }

  return [...groups.entries()]
    .filter(([, components]) => components.length > 0)
    .map(([category, components]) => ({
      category,
      label: COMPONENT_CATEGORY_LABELS.get(category) ?? category,
      count: components.length,
      components,
    }))
}

function IntroSpecimen() {
  const [message, setMessage] = createSignal('Prepare the release note')
  const [savedMessage, setSavedMessage] = createSignal<string | undefined>()

  function saveSpecimen(event: SubmitEvent): void {
    event.preventDefault()
    setSavedMessage(message().trim() || 'Untitled update')
  }

  return (
    <section
      aria-labelledby="landing-specimen"
      class="text-card-foreground border border-border/60 rounded-2xl bg-card/40 overflow-hidden"
    >
      <div class="p-5 border-b border-border/60 sm:p-6">
        <div class="flex flex-wrap gap-3 items-start justify-between">
          <div class="max-w-xl">
            <p class="text-[0.7rem] text-muted-foreground/80 tracking-wider font-mono font-semibold uppercase">
              Live specimen
            </p>
            <h2
              id="landing-specimen"
              class="text-xl text-foreground tracking-tight font-semibold mt-1.5 sm:text-2xl"
            >
              Compose a small, usable surface
            </h2>
            <p class="text-sm text-muted-foreground leading-relaxed mt-2">
              This uses form controls, keyboard-navigable tabs, a status message, and a dialog from
              the library without simulating an application shell.
            </p>
          </div>
          <Badge variant="outline" leading="i-lucide-component">
            Local interaction
          </Badge>
        </div>
      </div>

      <div class="p-5 gap-5 grid sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.7fr)]">
        <form class="flex flex-col gap-4 min-w-0" onSubmit={saveSpecimen}>
          <div class="flex flex-col gap-2">
            <label for="landing-message" class="text-xs text-muted-foreground font-medium">
              Release message
            </label>
            <input
              id="landing-message"
              type="text"
              value={message()}
              placeholder="Write an update"
              onInput={(event) => setMessage(event.currentTarget.value)}
              class="text-sm text-foreground px-3 docs-focus-visible border border-border/60 rounded-lg bg-background h-9 shadow-xs placeholder:text-muted-foreground"
            />
          </div>

          <Checkbox
            label="Include component examples"
            description="A normal checkbox keeps the choice visible and keyboard reachable."
            defaultChecked
          />

          <div class="flex flex-wrap gap-2 items-center">
            <Button type="submit" size="sm">
              Save specimen
            </Button>
            <Dialog
              title="Review the specimen"
              description="The dialog is an overlay component with its own focus and dismissal behavior."
              body={
                <p class="text-sm text-muted-foreground leading-relaxed">
                  The current message is kept in this local example and is never sent anywhere.
                </p>
              }
            >
              {(triggerProps) => (
                <Button {...triggerProps} type="button" variant="outline" size="sm">
                  Review in dialog
                </Button>
              )}
            </Dialog>
            <output aria-live="polite" class="text-xs text-muted-foreground">
              {savedMessage() ? `Saved: ${savedMessage()}` : 'Not saved'}
            </output>
          </div>
        </form>

        <div class="p-4 border border-border/60 rounded-xl bg-background/50 min-w-0">
          <Tabs
            defaultValue="structure"
            size="sm"
            classes={{
              list: 'w-full justify-start border-b border-border/60 rounded-none bg-transparent',
              trigger: 'docs-focus-visible',
              content: 'pt-3',
            }}
            items={[
              {
                value: 'structure',
                label: 'Structure',
                content: (
                  <p class="text-xs text-muted-foreground leading-relaxed">
                    Put primitives together with ordinary Solid JSX, then narrow visual changes to
                    the slot that owns them.
                  </p>
                ),
              },
              {
                value: 'states',
                label: 'States',
                content: (
                  <p class="text-xs text-muted-foreground leading-relaxed">
                    Form values, selection, and overlay presence remain local and explicit instead
                    of relying on a page-level controller.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </div>
    </section>
  )
}

export const IntroComponents = () => {
  const groupedComponents = getIntroComponentGroups()

  return (
    <div class="mt-8 flex flex-col gap-10">
      <IntroSpecimen />

      <section aria-labelledby="composition">
        <h2
          id="composition"
          class="text-lg text-foreground tracking-tight font-semibold sm:text-xl"
        >
          Compose from roots and named slots
        </h2>
        <div class="mt-3 gap-x-8 gap-y-4 grid sm:grid-cols-2">
          <p class="text-sm text-muted-foreground leading-relaxed">
            Components expose a root surface for ordinary{' '}
            <code class="docs-inline-code">class</code> and{' '}
            <code class="docs-inline-code">style</code> overrides. Named internals use{' '}
            <code class="docs-inline-code">classes</code> and{' '}
            <code class="docs-inline-code">styles</code> so a targeted change does not depend on DOM
            order.
          </p>
          <p class="text-sm text-muted-foreground leading-relaxed">
            The documentation renders page structure during Solid SSR, then hydrates local examples
            in the browser. Keep component composition in regular JSX so server and client agree on
            the initial tree.
          </p>
        </div>
      </section>

      <section aria-labelledby="compatibility">
        <h2
          id="compatibility"
          class="text-lg text-foreground tracking-tight font-semibold sm:text-xl"
        >
          Compatibility
        </h2>
        <p class="text-sm text-muted-foreground leading-relaxed mt-3">
          Moraine is built for SolidJS. UnoCSS is the documented styling path through{' '}
          <code class="docs-inline-code">moraine/unocss</code>; the Tailwind integration is
          experimental and is documented separately in the{' '}
          <a
            class="text-primary docs-focus-visible underline underline-offset-3 hover:text-primary-hover"
            href="/styling"
          >
            styling guide
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="component-directory">
        <div class="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h2
              id="component-directory"
              class="text-lg text-foreground tracking-tight font-semibold sm:text-xl"
            >
              Component directory
            </h2>
            <p class="text-sm text-muted-foreground leading-relaxed mt-1">
              Generated from the public API index. Descriptions and source paths follow the current
              component inventory.
            </p>
          </div>
          <Badge variant="outline">{apiIndex.components.length} components</Badge>
        </div>

        <div class="mt-6 space-y-8">
          <For each={groupedComponents}>
            {(group) => (
              <section aria-labelledby={`component-category-${group.category}`} class="space-y-3">
                <div class="pb-2 border-b border-border/60 flex gap-3 items-baseline justify-between">
                  <h3
                    id={`component-category-${group.category}`}
                    class="text-sm text-foreground font-semibold"
                  >
                    {group.label}
                  </h3>
                  <span class="text-xs text-muted-foreground font-mono">
                    {group.count} components
                  </span>
                </div>
                <ul class="m-0 p-0 list-none gap-2.5 grid lg:grid-cols-2">
                  <For each={group.components}>
                    {(component) => (
                      <li>
                        <a
                          href={`/${component.key}`}
                          class="group p-3.5 docs-focus-visible border border-border/60 rounded-xl bg-card/30 block transition-all hover:(border-border bg-muted/40)"
                        >
                          <span class="text-sm text-foreground font-medium transition-colors group-hover:text-primary">
                            {component.name}
                          </span>
                          <span class="text-xs text-muted-foreground leading-relaxed mt-1 block">
                            {component.description}
                          </span>
                          <code class="text-[0.7rem] text-muted-foreground/70 font-mono mt-2 block break-all">
                            {component.sourcePath}
                          </code>
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </section>
            )}
          </For>
        </div>
      </section>

      <section aria-labelledby="resources">
        <h2 id="resources" class="text-xl text-foreground font-semibold sm:text-2xl">
          Resources
        </h2>
        <ul class="mt-3 p-0 list-none gap-x-6 gap-y-3 grid sm:grid-cols-2">
          <li>
            <a
              class="text-primary docs-focus-visible underline underline-offset-2 hover:text-primary-hover"
              href="/styling"
            >
              Styling guide
            </a>
          </li>
          <li>
            <a
              class="text-primary docs-focus-visible underline underline-offset-2 hover:text-primary-hover"
              href="/typescript"
            >
              TypeScript guide
            </a>
          </li>
          <li>
            <a
              class="text-primary docs-focus-visible underline underline-offset-2 hover:text-primary-hover"
              href="/utils"
            >
              Utility reference
            </a>
          </li>
          <li>
            <a
              class="text-primary docs-focus-visible underline underline-offset-2 hover:text-primary-hover"
              href="/llms.txt"
            >
              llms.txt
            </a>
          </li>
          <li>
            <a
              class="text-primary docs-focus-visible underline underline-offset-2 hover:text-primary-hover"
              href="https://github.com/subframe7536/moraine"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source repository
            </a>
          </li>
          <li>
            <a
              class="text-primary docs-focus-visible underline underline-offset-2 hover:text-primary-hover"
              href="https://github.com/subframe7536/moraine/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              README
            </a>
          </li>
          <li>
            <a
              class="text-primary docs-focus-visible underline underline-offset-2 hover:text-primary-hover"
              href="https://github.com/subframe7536/moraine/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT License
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
