import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon, Input, InputGroup, cn } from '../../../../src'
import {
  createApiReferenceModel,
  getApiReferenceTocEntries,
} from '../../../build/api-doc/presentation'
import type {
  ApiReferencePresentationModel,
  PresentationPartSection,
  PresentationPropItem,
  PresentationStyleContract,
} from '../../../build/api-doc/presentation'
import type { ComponentApi } from '../../../build/api-doc/types'
import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from '../../../build/markdown/shared.class'

export type PropDoc = PresentationPropItem

function normalizeType(type: string): string {
  return type.replaceAll('cls_variant0.', '').replaceAll('_$', '')
}

function PropRowItem(props: { prop: PropDoc }): JSX.Element {
  const [expanded, setExpanded] = createSignal(false)
  const [copied, setCopied] = createSignal(false)

  const copyPermalink = (event: MouseEvent) => {
    event.stopPropagation()
    if (!props.prop.anchorId || typeof window === 'undefined') {
      return
    }
    const url = new URL(window.location.href)
    url.hash = props.prop.anchorId
    void navigator.clipboard.writeText(url.toString())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <>
      <tr
        id={props.prop.anchorId}
        class={cn(
          'group border-t border-border/40 cursor-pointer transition-colors hover:bg-muted/30',
          expanded() && 'bg-muted/20',
        )}
        onClick={() => setExpanded(!expanded())}
      >
        <td class="text-xs text-primary font-medium font-mono px-3.5 py-2.5 whitespace-nowrap">
          <div class="flex gap-1.5 items-center">
            <Show when={props.prop.anchorId}>
              <button
                type="button"
                onClick={copyPermalink}
                title="Copy permalink"
                class="text-muted-foreground opacity-0 cursor-pointer transition-opacity group-hover:opacity-60 hover:!opacity-100"
              >
                {copied() ? '✓' : '#'}
              </button>
            </Show>
            <span>
              {props.prop.name}
              {!props.prop.optional ? '*' : ''}
            </span>
          </div>
        </td>
        <td class="px-3.5 py-2.5">
          <code
            class="text-xs text-muted-foreground font-mono px-1.5 py-0.5 align-middle border border-border/40 rounded-md bg-muted/70 max-w-[260px] inline-block truncate"
            title={props.prop.type}
          >
            {normalizeType(props.prop.type)}
          </code>
        </td>
        <td class="text-xs text-muted-foreground px-3.5 py-2.5 whitespace-nowrap">
          <Show when={props.prop.defaultValue !== undefined} fallback="—">
            <code class="font-mono px-1.5 py-0.5 border border-border/40 rounded-md bg-muted/70">
              {props.prop.defaultValue}
            </code>
          </Show>
        </td>
        <td class="text-xs text-muted-foreground leading-relaxed px-3.5 py-2.5">
          <Show when={props.prop.description} fallback="—">
            {(description) => (
              <div
                class={cn('transition-all', !expanded() && 'line-clamp-2')}
                // oxlint-disable-next-line subf/solid-no-innerhtml
                innerHTML={description()}
              />
            )}
          </Show>
        </td>
      </tr>
      <Show when={expanded()}>
        <tr class="border-t border-border/30 bg-muted/15">
          <td colspan="4" class="px-5 py-3">
            <span class="text-[0.68rem] text-muted-foreground tracking-wider font-semibold uppercase">
              Full TypeScript Type
            </span>
            <pre class="text-xs text-foreground font-mono mt-1 p-2.5 border border-border/40 rounded-lg bg-muted/60 overflow-x-auto">
              {props.prop.type}
            </pre>
          </td>
        </tr>
      </Show>
    </>
  )
}

function PropRows(props: { props: PropDoc[]; nameColumn?: string }): JSX.Element {
  return (
    <div class="mb-6 mt-3 border border-border/60 rounded-xl bg-card/30 overflow-x-auto">
      <table class="text-sm m-0 w-full border-collapse">
        <thead>
          <tr class="text-[0.7rem] text-muted-foreground tracking-wider text-left bg-muted/40 uppercase">
            <th class="font-semibold px-3.5 py-2.5">{props.nameColumn ?? 'Prop'}</th>
            <th class="font-semibold px-3.5 py-2.5">Type</th>
            <th class="font-semibold px-3.5 py-2.5">Default</th>
            <th class="font-semibold px-3.5 py-2.5">Description</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.props}>{(prop) => <PropRowItem prop={prop} />}</For>
        </tbody>
      </table>
    </div>
  )
}

function PropsSection(props: {
  part: PresentationPartSection
  headingLevel: number
  id?: string
}): JSX.Element {
  const [query, setQuery] = createSignal('')
  const filteredProps = createMemo(() => {
    const value = query().trim().toLowerCase()
    if (!value) {
      return props.part.props
    }
    return props.part.props.filter((prop) =>
      [prop.name, prop.type, prop.description]
        .filter((item): item is string => Boolean(item))
        .some((item) => item.toLowerCase().includes(value)),
    )
  })

  return (
    <Show when={props.part.props.length > 0}>
      <section class="mt-6">
        <HeadingWithAnchor id={props.id ?? `${props.part.id}-props`} level={props.headingLevel}>
          Props
        </HeadingWithAnchor>
        <Show when={props.part.props.length > 2}>
          <InputGroup size="sm" class="mt-4 w-full sm:w-64">
            <InputGroup.Leading>
              <Icon name="icon-search" />
            </InputGroup.Leading>
            <Input
              aria-label={`Search ${props.part.partName} props`}
              placeholder="Filter props..."
              value={query()}
              onValueChange={(value) => setQuery(value ?? '')}
              onInput={(event) => setQuery(event.currentTarget.value)}
            />
          </InputGroup>
        </Show>
        <Show
          when={filteredProps().length > 0}
          fallback={
            <p class="text-sm text-muted-foreground mt-4">No props matching "{query()}".</p>
          }
        >
          <PropRows props={filteredProps()} />
        </Show>
      </section>
    </Show>
  )
}

function StyleContractSection(props: { styling: PresentationStyleContract }): JSX.Element {
  const hasContract = () =>
    props.styling.slots.length > 0 ||
    props.styling.dataAttributes.length > 0 ||
    props.styling.cssVariables.length > 0

  return (
    <Show when={hasContract()}>
      <section class="mt-10 pt-6 border-t border-border/40">
        <HeadingWithAnchor id="dom-styling" level={3}>
          DOM &amp; State
        </HeadingWithAnchor>

        <Show when={props.styling.slots.length > 0}>
          <h4 class="text-xs text-foreground tracking-wider font-bold mt-5 uppercase">Slots</h4>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <For each={props.styling.slots}>
              {(slot) => (
                <code class="text-xs text-muted-foreground font-mono px-2 py-1 border border-border/50 rounded-md bg-muted/50">
                  {slot}
                </code>
              )}
            </For>
          </div>
        </Show>

        <Show when={props.styling.dataAttributes.length > 0}>
          <h4 class="text-xs text-foreground tracking-wider font-bold mt-6 uppercase">
            Data Attributes
          </h4>
          <div class="mt-3 border border-border/60 rounded-xl bg-card/30 overflow-hidden">
            <For each={props.styling.dataAttributes}>
              {(target) => (
                <section class="p-3.5 border-t border-border/40 first:border-t-0">
                  <code class="text-xs text-primary font-mono font-semibold">{target.target}</code>
                  <ul class="m-0 mt-2 p-0 list-none space-y-1.5">
                    <For each={target.attributes}>
                      {(attribute) => (
                        <li class="text-xs text-muted-foreground flex gap-3 items-baseline">
                          <code class="text-foreground font-mono min-w-fit">{attribute.name}</code>
                          <Show when={attribute.description}>
                            {(description) => <span>{description()}</span>}
                          </Show>
                        </li>
                      )}
                    </For>
                  </ul>
                </section>
              )}
            </For>
          </div>
        </Show>

        <Show when={props.styling.cssVariables.length > 0}>
          <h4 class="text-xs text-foreground tracking-wider font-bold mt-6 uppercase">
            CSS Variables
          </h4>
          <div class="mt-3 border border-border/60 rounded-xl bg-card/30 overflow-hidden">
            <For each={props.styling.cssVariables}>
              {(target) => (
                <section class="p-3.5 border-t border-border/40 first:border-t-0">
                  <code class="text-xs text-primary font-mono font-semibold">{target.target}</code>
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <For each={target.variables}>
                      {(variable) => (
                        <code class="text-xs text-muted-foreground font-mono px-2 py-1 border border-border/50 rounded-md bg-muted/50">
                          {variable}
                        </code>
                      )}
                    </For>
                  </div>
                </section>
              )}
            </For>
          </div>
        </Show>
      </section>
    </Show>
  )
}

export function HeadingWithAnchor(props: {
  id: string
  children: JSX.Element
  level: number
  class?: string
}): JSX.Element {
  const component = createMemo(() => `h${props.level}`)
  return (
    <Dynamic
      component={component()}
      id={props.id}
      tabIndex={-1}
      class={cn(MARKDOWN_ANCHOR_HEADING_CLASS, `docs-${component()}`, props.class)}
    >
      {props.children}
      <a
        href={`#${props.id}`}
        class={MARKDOWN_ANCHOR_LINK_CLASS}
        aria-label={DOCS_HEADING_ANCHOR_ARIA_LABEL}
      >
        #
      </a>
    </Dynamic>
  )
}

export interface DocsApiReferenceModel {
  reference: ApiReferencePresentationModel | null
}

export function createDocsApiReferenceModel(
  apiDoc: ComponentApi | undefined,
): DocsApiReferenceModel {
  return { reference: createApiReferenceModel(apiDoc) }
}

export function getDocsApiReferenceTocEntries(apiDoc: ComponentApi | undefined) {
  return getApiReferenceTocEntries(apiDoc)
}

export function DocsApiReference(props: { apiDoc?: ComponentApi }): JSX.Element {
  const model = createMemo(() => createApiReferenceModel(props.apiDoc))

  return (
    <Show when={model()}>
      {(reference) => (
        <>
          <HeadingWithAnchor id="api-reference" level={2}>
            API
          </HeadingWithAnchor>

          <Show
            when={reference().kind === 'composite'}
            fallback={
              <Show when={reference().parts[0]}>
                {(part) => (
                  <>
                    <PartMetadata part={part()} description={reference().description} />
                    <PropsSection part={part()} headingLevel={3} id="api-props" />
                  </>
                )}
              </Show>
            }
          >
            <Show when={reference().parts.length > 1}>
              <nav
                aria-label="Component parts"
                class="scrollbar-none mb-6 px-1 py-2.5 border-b border-border/40 bg-background/90 flex gap-1.5 items-center top-14 sticky z-10 overflow-x-auto backdrop-blur -mx-1"
              >
                <span class="text-xs text-muted-foreground font-semibold mr-1">Parts:</span>
                <For each={reference().parts}>
                  {(part) => (
                    <a
                      href={`#${part.id}`}
                      class="text-xs text-foreground font-mono px-2.5 py-1 border border-border/60 rounded-md bg-muted/40 whitespace-nowrap hover:text-primary"
                    >
                      {part.heading}
                    </a>
                  )}
                </For>
              </nav>
            </Show>
            <For each={reference().parts}>
              {(part) => (
                <section class="mt-8 pt-6 border-t border-border/40 first:mt-4 first:pt-0 first:border-0">
                  <HeadingWithAnchor id={part.id} level={3}>
                    {part.heading}
                  </HeadingWithAnchor>
                  <PartMetadata part={part} />
                  <PropsSection part={part} headingLevel={4} />
                </section>
              )}
            </For>
          </Show>

          <Show when={reference().item}>
            {(item) => (
              <section class="mt-8 pt-6 border-t border-border/40">
                <HeadingWithAnchor id={item().id} level={3}>
                  {item().heading}
                </HeadingWithAnchor>
                <Show when={item().description}>
                  <p class="text-sm text-muted-foreground mt-1">{item().description}</p>
                </Show>
                <PropRows props={item().props} nameColumn="Field" />
              </section>
            )}
          </Show>

          <StyleContractSection styling={reference().styling} />
        </>
      )}
    </Show>
  )
}

function PartMetadata(props: { part: PresentationPartSection; description?: string }): JSX.Element {
  return (
    <div class="mt-2 flex flex-col gap-2">
      <div class="text-xs flex flex-wrap gap-2 items-center">
        <Show when={props.part.accessText}>
          {(accessText) => (
            <code class="text-primary font-mono px-2 py-0.5 border border-border/40 rounded bg-muted/70">
              {accessText()}
            </code>
          )}
        </Show>
        <Show when={!props.part.rendersDom}>
          <span class="text-muted-foreground px-2 py-0.5 border border-border/40 rounded-full bg-muted">
            Context Primitive (No DOM)
          </span>
        </Show>
        <Show when={props.part.defaultElement}>
          {(element) => (
            <span class="text-muted-foreground font-mono px-2 py-0.5 border border-border/40 rounded-full bg-muted/60">
              &lt;{element()}&gt;{props.part.polymorphic ? ' (Polymorphic)' : ''}
            </span>
          )}
        </Show>
        <Show when={props.part.genericsSignature}>
          {(generics) => (
            <span class="text-muted-foreground font-mono px-2 py-0.5 rounded-md bg-muted/60">
              Generics: {generics()}
            </span>
          )}
        </Show>
      </div>
      <Show when={props.part.description ?? props.description}>
        {(description) => <p class="text-sm text-muted-foreground m-0">{description()}</p>}
      </Show>
    </div>
  )
}
