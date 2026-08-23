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
      class="border border-border rounded-xl bg-card text-card-foreground overflow-hidden"
    >
      <div class="p-5 border-b border-border sm:p-6">
        <div class="flex flex-wrap gap-3 items-start justify-between">
          <div class="max-w-xl">
            <p class="text-xs text-muted-foreground font-mono tracking-wide uppercase">
              Live specimen
            </p>
            <h2
              id="landing-specimen"
              class="mt-2 text-xl text-foreground font-semibold sm:text-2xl"
            >
              Compose a small, usable surface
            </h2>
            <p class="mt-2 text-sm text-muted-foreground leading-6">
              This uses form controls, keyboard-navigable tabs, a status message, and a dialog from
              the library without simulating an application shell.
            </p>
          </div>
          <Badge variant="outline" leading="i-lucide-component">
            Local interaction
          </Badge>
        </div>
      </div>

      <div class="gap-5 grid p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.7fr)]">
        <form class="flex flex-col gap-4 min-w-0" onSubmit={saveSpecimen}>
          <div class="flex flex-col gap-2">
            <label for="landing-message" class="text-sm text-foreground font-medium">
              Release message
            </label>
            <input
              id="landing-message"
              type="text"
              value={message()}
              placeholder="Write an update"
              onInput={(event) => setMessage(event.currentTarget.value)}
              class="docs-focus-visible px-3 border border-input rounded-md bg-background h-10 text-sm text-foreground shadow-xs placeholder:text-muted-foreground"
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
                <p class="text-sm text-muted-foreground leading-6">
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
            <output aria-live="polite" class="text-sm text-muted-foreground">
              {savedMessage() ? `Saved: ${savedMessage()}` : 'Not saved'}
            </output>
          </div>
        </form>

        <div class="border border-border rounded-lg bg-background p-3 min-w-0 sm:p-4">
          <Tabs
            defaultValue="structure"
            size="sm"
            classes={{
              list: 'w-full justify-start border-b border-border rounded-none bg-transparent',
              trigger: 'docs-focus-visible',
              content: 'pt-4',
            }}
            items={[
              {
                value: 'structure',
                label: 'Structure',
                content: (
                  <p class="text-sm text-muted-foreground leading-6">
                    Put primitives together with ordinary Solid JSX, then narrow visual changes to
                    the slot that owns them.
                  </p>
                ),
              },
              {
                value: 'states',
                label: 'States',
                content: (
                  <p class="text-sm text-muted-foreground leading-6">
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
    <div class="flex flex-col gap-10 mt-8">
      <IntroSpecimen />

      <section aria-labelledby="composition">
        <h2 id="composition" class="text-xl text-foreground font-semibold sm:text-2xl">
          Compose from roots and named slots
        </h2>
        <div class="gap-x-8 gap-y-4 grid mt-3 sm:grid-cols-2">
          <p class="text-sm text-muted-foreground leading-6">
            Components expose a root surface for ordinary{' '}
            <code class="font-mono text-foreground">class</code> and{' '}
            <code class="font-mono text-foreground">style</code> overrides. Named internals use{' '}
            <code class="font-mono text-foreground">classes</code> and{' '}
            <code class="font-mono text-foreground">styles</code> so a targeted change does not
            depend on DOM order.
          </p>
          <p class="text-sm text-muted-foreground leading-6">
            The documentation renders page structure during Solid SSR, then hydrates local examples
            in the browser. Keep component composition in regular JSX so server and client agree on
            the initial tree.
          </p>
        </div>
      </section>

      <section aria-labelledby="compatibility">
        <h2 id="compatibility" class="text-xl text-foreground font-semibold sm:text-2xl">
          Compatibility
        </h2>
        <p class="mt-3 text-sm text-muted-foreground leading-6">
          Moraine is built for SolidJS. UnoCSS is the documented styling path through{' '}
          <code class="font-mono text-foreground">moraine/unocss</code>; the Tailwind integration is
          experimental and is documented separately in the{' '}
          <a
            class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
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
            <h2 id="component-directory" class="text-xl text-foreground font-semibold sm:text-2xl">
              Component directory
            </h2>
            <p class="mt-2 text-sm text-muted-foreground leading-6">
              Generated from the public API index. Descriptions and source paths follow the current
              component inventory.
            </p>
          </div>
          <Badge variant="outline">{apiIndex.components.length} components</Badge>
        </div>

        <div class="space-y-8 mt-6">
          <For each={groupedComponents}>
            {(group) => (
              <section aria-labelledby={`component-category-${group.category}`} class="space-y-3">
                <div class="flex gap-3 items-baseline justify-between border-b border-border pb-2">
                  <h3
                    id={`component-category-${group.category}`}
                    class="text-base text-foreground font-semibold"
                  >
                    {group.label}
                  </h3>
                  <span class="text-xs text-muted-foreground font-mono">
                    {group.count} components
                  </span>
                </div>
                <ul class="gap-2 grid list-none m-0 p-0 lg:grid-cols-2">
                  <For each={group.components}>
                    {(component) => (
                      <li>
                        <a
                          href={`/${component.key}`}
                          class="docs-focus-visible group p-3 border border-border rounded-lg bg-background block transition-colors hover:bg-muted"
                        >
                          <span class="text-sm text-foreground font-medium group-hover:text-primary">
                            {component.name}
                          </span>
                          <span class="block mt-1 text-xs text-muted-foreground leading-5">
                            {component.description}
                          </span>
                          <code class="block mt-2 text-xs text-muted-foreground font-mono break-all">
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
        <ul class="gap-x-6 gap-y-3 grid list-none mt-3 p-0 sm:grid-cols-2">
          <li>
            <a
              class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
              href="/styling"
            >
              Styling guide
            </a>
          </li>
          <li>
            <a
              class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
              href="/typescript"
            >
              TypeScript guide
            </a>
          </li>
          <li>
            <a
              class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
              href="/utils"
            >
              Utility reference
            </a>
          </li>
          <li>
            <a
              class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
              href="/llms.txt"
            >
              llms.txt
            </a>
          </li>
          <li>
            <a
              class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
              href="https://github.com/subframe7536/moraine"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source repository
            </a>
          </li>
          <li>
            <a
              class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
              href="https://github.com/subframe7536/moraine/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              README
            </a>
          </li>
          <li>
            <a
              class="docs-focus-visible text-primary underline underline-offset-2 hover:text-primary-hover"
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
