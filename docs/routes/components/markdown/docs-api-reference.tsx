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
  PresentationRuntimeAttributeItem,
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
    setTimeout(() => setCopied(false), 1600)
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
                <Show when={copied()} fallback={<span class="text-[0.68rem]">#</span>}>
                  <span class="text-[0.68rem] text-emerald-500 font-bold">✓</span>
                </Show>
              </button>
            </Show>
            <span>
              {props.prop.name}
              {!props.prop.optional ? '*' : ''}
            </span>
            <Show when={props.prop.traits?.includes('callback')}>
              <span class="text-[0.62rem] text-blue-600 font-mono px-1 py-0.2 rounded bg-blue-500/10 dark:text-blue-400">
                fn
              </span>
            </Show>
            <Show when={props.prop.traits?.includes('render-prop')}>
              <span class="text-[0.62rem] text-purple-600 font-mono px-1 py-0.2 rounded bg-purple-500/10 dark:text-purple-400">
                render
              </span>
            </Show>
          </div>
        </td>
        <td class="px-3.5 py-2.5">
          <code
            class="text-xs text-muted-foreground font-mono px-1.5 py-0.5 align-middle border border-border/40 rounded-md bg-muted/70 max-w-[200px] inline-block truncate sm:max-w-[260px]"
            title={props.prop.type}
          >
            {normalizeType(props.prop.type)}
          </code>
        </td>
        <td class="text-xs text-muted-foreground px-3.5 py-2.5 whitespace-nowrap">
          <Show
            when={props.prop.defaultValue !== undefined}
            fallback={<span class="text-muted-foreground/60">—</span>}
          >
            <code class="font-mono px-1.5 py-0.5 border border-border/40 rounded-md bg-muted/70">
              {props.prop.defaultValue}
            </code>
          </Show>
        </td>
        <td class="text-xs text-muted-foreground leading-relaxed px-3.5 py-2.5">
          <div class="flex gap-2 items-start justify-between">
            <div class="flex-1">
              <Show when={props.prop.description} fallback="—">
                {(description) => (
                  <div
                    class={cn('transition-all', !expanded() && 'line-clamp-2')}
                    // oxlint-disable-next-line subf/solid-no-innerhtml
                    innerHTML={description()}
                  />
                )}
              </Show>
            </div>
            <button
              type="button"
              aria-label="Toggle prop details"
              class={cn(
                'text-muted-foreground/60 p-1 shrink-0 cursor-pointer transition-transform hover:text-foreground',
                expanded() && 'rotate-180',
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-2 stroke-current"
              >
                <path d="M2.5 4.5L6 8L9.5 4.5" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      <Show when={expanded()}>
        <tr class="border-t border-border/30 bg-muted/15">
          <td colspan="4" class="px-5 py-3">
            <div class="text-xs text-muted-foreground flex flex-col gap-2.5">
              <div>
                <span class="text-[0.68rem] text-muted-foreground/80 tracking-wider font-semibold mb-1 block uppercase">
                  Full TypeScript Type
                </span>
                <pre class="text-xs text-foreground font-mono p-2.5 border border-border/40 rounded-lg bg-muted/60 overflow-x-auto">
                  {props.prop.type}
                </pre>
              </div>
              <Show when={props.prop.stateRole}>
                <div class="text-xs">
                  <span class="text-foreground font-semibold">State Relation:</span> Part of state
                  binding with role{' '}
                  <code class="text-primary font-medium font-mono">{props.prop.stateRole}</code>.
                </div>
              </Show>
              <Show when={props.prop.anchorId}>
                <div class="pt-1 flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={copyPermalink}
                    class="text-xs text-primary inline-flex gap-1.5 cursor-pointer items-center hover:underline"
                  >
                    <span>{copied() ? 'Copied permalink!' : 'Copy permalink URL'}</span>
                  </button>
                </div>
              </Show>
            </div>
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
          <tr class="text-[0.7rem] text-muted-foreground/80 tracking-wider text-left bg-muted/40 uppercase">
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

function ReferenceTable(props: {
  headers: string[]
  rows: Array<{ cells: string[] }>
}): JSX.Element {
  return (
    <div class="mt-3 border border-border/60 rounded-xl bg-card/30 overflow-x-auto">
      <table class="text-sm m-0 w-full border-collapse">
        <thead>
          <tr class="text-[0.68rem] text-muted-foreground/80 tracking-wider text-left bg-muted/40 uppercase">
            <For each={props.headers}>
              {(header) => <th class="font-semibold px-3.5 py-2.5">{header}</th>}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(row) => (
              <tr class="align-top border-t border-border/40 hover:bg-muted/30">
                <For each={row.cells}>
                  {(cell, index) => (
                    <td class="text-xs text-muted-foreground leading-relaxed px-3.5 py-2.5">
                      <Show when={index() < 3} fallback={cell}>
                        <code class="text-xs font-mono">{cell}</code>
                      </Show>
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}

function attributeMatches(
  attribute: PresentationRuntimeAttributeItem,
  target: string,
  query: string,
): boolean {
  const targetMatches = target === 'all' || attribute.targets.includes(target)
  if (!targetMatches) {
    return false
  }
  if (!query) {
    return true
  }
  return [attribute.name, attribute.value, attribute.description, ...attribute.targets]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(query))
}

function AttributeTable(props: {
  heading: string
  attributes: PresentationRuntimeAttributeItem[]
  target: string
  query: string
}): JSX.Element {
  const rows = createMemo(() =>
    props.attributes
      .filter((attribute) => attributeMatches(attribute, props.target, props.query))
      .map((attribute) => ({
        cells: [
          attribute.name,
          attribute.targets.join(', '),
          attribute.value,
          attribute.description ?? '—',
        ],
      })),
  )

  return (
    <Show when={rows().length > 0}>
      <section class="mt-5">
        <h5 class="text-xs text-foreground tracking-wider font-bold uppercase">{props.heading}</h5>
        <ReferenceTable headers={['Attribute', 'Target', 'Value', 'Description']} rows={rows()} />
      </section>
    </Show>
  )
}

function DomStylingSection(props: {
  part: PresentationPartSection
  headingLevel: number
  id?: string
}) {
  const targetOptions = createMemo(() => props.part.anatomy?.map((item) => item.name) ?? [])
  const [target, setTarget] = createSignal('')
  const [query, setQuery] = createSignal('')
  const selectedTarget = createMemo(() => target() || targetOptions()[0] || 'all')
  const normalizedQuery = createMemo(() => query().trim().toLowerCase())
  const cssVariableRows = createMemo(() =>
    (props.part.cssVariables ?? [])
      .filter((variable) => selectedTarget() === 'all' || variable.target === selectedTarget())
      .filter((variable) => {
        if (!normalizedQuery()) {
          return true
        }
        return [variable.name, variable.target, variable.description]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery()))
      })
      .map((variable) => ({
        cells: [variable.name, variable.target, variable.description ?? '—'],
      })),
  )

  const hasAttributes = createMemo(() =>
    Boolean(
      props.part.dataAttributes?.length ||
      props.part.accessibility?.length ||
      props.part.cssVariables?.length,
    ),
  )

  return (
    <section class="mt-6">
      <HeadingWithAnchor id={props.id ?? `${props.part.id}-dom-styling`} level={props.headingLevel}>
        DOM &amp; Styling
      </HeadingWithAnchor>

      <Show
        when={props.part.rendersDom}
        fallback={<p class="text-sm text-muted-foreground mt-2">This part does not render DOM.</p>}
      >
        <Show when={props.part.anatomy?.length}>
          <h4 class="text-xs text-foreground tracking-wider font-bold mt-4 uppercase">Anatomy</h4>
          <ReferenceTable
            headers={['Target', 'Selector', 'Element', 'Purpose']}
            rows={(props.part.anatomy ?? []).map((item) => ({
              key: item.name,
              cells: [
                item.name,
                item.selector ?? '—',
                item.element ?? '—',
                item.description ?? item.condition ?? '—',
              ],
            }))}
          />
        </Show>

        <Show when={hasAttributes()}>
          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
            <InputGroup size="sm" class="flex-1 max-w-sm">
              <InputGroup.Leading>
                <Icon name="icon-search" />
              </InputGroup.Leading>
              <Input
                aria-label="Filter DOM attributes"
                placeholder="Filter attributes..."
                value={query()}
                onInput={(event) => setQuery(event.currentTarget.value)}
              />
            </InputGroup>
            <select
              aria-label="DOM target"
              class="text-xs px-3 py-2 border border-border rounded-md bg-background"
              value={selectedTarget()}
              onChange={(event) => setTarget(event.currentTarget.value)}
            >
              <For each={targetOptions()}>{(name) => <option value={name}>{name}</option>}</For>
              <option value="all">All attributes</option>
            </select>
          </div>

          <AttributeTable
            heading="Data Attributes"
            attributes={props.part.dataAttributes ?? []}
            target={selectedTarget()}
            query={normalizedQuery()}
          />
          <AttributeTable
            heading="Accessibility"
            attributes={props.part.accessibility ?? []}
            target={selectedTarget()}
            query={normalizedQuery()}
          />
          <Show when={cssVariableRows().length > 0}>
            <section class="mt-5">
              <h5 class="text-xs text-foreground tracking-wider font-bold uppercase">
                CSS Variables
              </h5>
              <ReferenceTable
                headers={['Variable', 'Target', 'Description']}
                rows={cssVariableRows()}
              />
            </section>
          </Show>
        </Show>
      </Show>
    </section>
  )
}

function PropsSection(props: {
  part: PresentationPartSection
  headingLevel: number
  id?: string
  nameColumn?: string
}): JSX.Element {
  const [query, setQuery] = createSignal('')
  const [selectedCategory, setSelectedCategory] = createSignal('all')

  const availableCategories = createMemo(() => {
    return props.part.propGroups.map((g) => ({
      group: g.group,
      heading: g.heading,
      count: g.props.length,
    }))
  })

  const totalPropsCount = createMemo(() =>
    props.part.propGroups.reduce((acc, g) => acc + g.props.length, 0),
  )

  const filteredGroups = createMemo(() => {
    const q = query().trim().toLowerCase()
    const cat = selectedCategory()

    return props.part.propGroups
      .filter((g) => cat === 'all' || g.group === cat)
      .map((g) => {
        if (!q) {
          return g
        }
        const matchingProps = g.props.filter((p) => {
          return (
            p.name.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          )
        })
        return {
          group: g.group,
          heading: g.heading,
          id: g.id,
          props: matchingProps,
        }
      })
      .filter((g) => g.props.length > 0)
  })

  return (
    <Show when={props.part.propGroups.length > 0}>
      <div class="mt-6">
        <HeadingWithAnchor id={props.id ?? `${props.part.id}-props`} level={props.headingLevel}>
          Props
        </HeadingWithAnchor>

        <Show when={totalPropsCount() > 2}>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Category Filter Pills */}
            <div class="flex flex-wrap gap-1.5 items-center">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                class={cn(
                  'text-xs font-medium px-2.5 py-1 border rounded-full cursor-pointer transition-colors',
                  selectedCategory() === 'all'
                    ? 'text-primary-foreground border-primary bg-primary'
                    : 'text-muted-foreground border-border/50 bg-muted/50 hover:text-foreground hover:bg-muted',
                )}
              >
                All ({totalPropsCount()})
              </button>
              <For each={availableCategories()}>
                {(cat) => (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat.group)}
                    class={cn(
                      'text-xs font-medium px-2.5 py-1 border rounded-full cursor-pointer transition-colors',
                      selectedCategory() === cat.group
                        ? 'text-primary-foreground border-primary bg-primary'
                        : 'text-muted-foreground border-border/50 bg-muted/50 hover:text-foreground hover:bg-muted',
                    )}
                  >
                    {cat.heading} ({cat.count})
                  </button>
                )}
              </For>
            </div>

            {/* Instant Search Input */}
            <InputGroup size="sm" class="w-full sm:w-56">
              <InputGroup.Leading>
                <Icon name="icon-search" />
              </InputGroup.Leading>
              <Input
                aria-label={`Search ${props.part.partName} props`}
                placeholder="Filter props..."
                value={query()}
                onValueChange={(val) => setQuery(val ?? '')}
                onInput={(e) => setQuery(e.target.value)}
              />
            </InputGroup>
          </div>
        </Show>

        <Show
          when={filteredGroups().length > 0}
          fallback={
            <div class="text-xs text-muted-foreground mt-4 p-6 text-center border border-border/60 rounded-xl bg-card/20">
              No props matching "{query()}".
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSelectedCategory('all')
                }}
                class="text-primary ml-2 underline cursor-pointer hover:opacity-80"
              >
                Reset filters
              </button>
            </div>
          }
        >
          <For each={filteredGroups()}>
            {(group) => (
              <div class="mt-4">
                <h4 class="text-xs text-foreground tracking-wider font-bold mb-2 uppercase">
                  {group.heading}
                </h4>
                <PropRows props={group.props} nameColumn={props.nameColumn} />
              </div>
            )}
          </For>
        </Show>
      </div>
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
                    {/* Component Meta / Signature banner for single component */}
                    <Show
                      when={
                        part().genericsSignature ||
                        part().defaultElement ||
                        part().polymorphic ||
                        part().description ||
                        reference().description
                      }
                    >
                      <div class="mb-6 mt-3 p-4 border border-border/60 rounded-xl bg-card/20 flex flex-col gap-2">
                        <div class="text-xs flex flex-wrap gap-2 items-center">
                          <Show when={part().defaultElement}>
                            <span class="text-foreground font-mono px-2 py-0.5 border border-border/40 rounded-md bg-muted">
                              renders &lt;{part().defaultElement}&gt;
                            </span>
                          </Show>
                          <Show when={part().polymorphic}>
                            <span class="text-primary font-mono px-2 py-0.5 border border-primary/20 rounded-md bg-primary/10">
                              Polymorphic (as)
                            </span>
                          </Show>
                          <Show when={part().genericsSignature}>
                            <span class="text-muted-foreground font-mono px-2 py-0.5 rounded-md bg-muted/60">
                              Generics: {part().genericsSignature}
                            </span>
                          </Show>
                        </div>
                        <Show when={part().description ?? reference().description}>
                          {(desc) => <p class="text-sm text-muted-foreground m-0">{desc()}</p>}
                        </Show>
                      </div>
                    </Show>

                    {/* PROPS FIRST */}
                    <PropsSection part={part()} headingLevel={3} id="api-props" />

                    {/* DOM & STATE SECOND */}
                    <DomStylingSection part={part()} headingLevel={3} id="dom-styling" />
                  </>
                )}
              </Show>
            }
          >
            {/* COMPOSITE COMPONENT: Sticky Part Quick-Bar */}
            <Show when={reference().parts.length > 1}>
              <nav
                aria-label="Component parts"
                class="scrollbar-none mb-6 px-1 py-2.5 border-b border-border/40 bg-background/90 flex gap-1.5 items-center top-14 sticky z-10 overflow-x-auto backdrop-blur -mx-1"
              >
                <span class="text-[0.68rem] text-muted-foreground tracking-wider font-semibold mr-1 shrink-0 uppercase">
                  Parts:
                </span>
                <For each={reference().parts}>
                  {(part) => (
                    <a
                      href={`#${part.id}`}
                      class="text-xs text-foreground font-mono px-2.5 py-1 border border-border/60 rounded-md bg-muted/40 whitespace-nowrap transition-colors hover:text-primary hover:bg-muted"
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
                  <div class="flex flex-wrap gap-2 items-baseline">
                    <HeadingWithAnchor id={part.id} level={3}>
                      {part.heading}
                    </HeadingWithAnchor>
                    <Show when={part.accessText}>
                      {(accessText) => (
                        <code class="text-xs text-primary font-mono px-2 py-0.5 border border-border/40 rounded bg-muted/70">
                          {accessText()}
                        </code>
                      )}
                    </Show>
                    <Show when={!part.rendersDom}>
                      <span class="text-[0.68rem] text-muted-foreground font-medium px-2 py-0.5 border border-border/40 rounded-full bg-muted">
                        Context Primitive (No DOM)
                      </span>
                    </Show>
                    <Show when={part.rendersDom && part.defaultElement}>
                      <span class="text-[0.68rem] text-muted-foreground font-mono px-2 py-0.5 border border-border/40 rounded-full bg-muted/60">
                        &lt;{part.defaultElement}&gt;{part.polymorphic ? ' (Polymorphic)' : ''}
                      </span>
                    </Show>
                  </div>

                  <Show when={part.description}>
                    {(description) => (
                      <p class="text-sm text-muted-foreground mt-1.5">{description()}</p>
                    )}
                  </Show>

                  {/* PROPS FIRST */}
                  <PropsSection part={part} headingLevel={4} />

                  {/* DOM & STATE SECOND */}
                  <Show when={part.rendersDom}>
                    <DomStylingSection part={part} headingLevel={4} />
                  </Show>
                </section>
              )}
            </For>
          </Show>

          {/* ITEM SECTION */}
          <Show when={reference().item}>
            {(item) => (
              <section class="mt-8 pt-6 border-t border-border/40">
                <HeadingWithAnchor id={item().id} level={3}>
                  {item().heading}
                </HeadingWithAnchor>
                <Show when={item().description}>
                  <p class="text-sm text-muted-foreground mb-3 mt-1">{item().description}</p>
                </Show>
                <PropRows props={item().props} nameColumn="Field" />
              </section>
            )}
          </Show>
        </>
      )}
    </Show>
  )
}
