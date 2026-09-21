import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon, Input, cn, InputGroup } from '../../../../src'
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

function PropRows(props: { props: PropDoc[]; nameColumn?: string }): JSX.Element {
  return (
    <div class="mb-6 mt-4 border border-border/60 rounded-xl bg-card/30 overflow-x-auto">
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
          <For each={props.props}>
            {(prop) => (
              <tr class="border-t border-border/40 transition-colors hover:bg-muted/30">
                <td class="text-xs text-primary font-medium font-mono px-3.5 py-2.5 whitespace-nowrap">
                  {prop.name}
                  {!prop.optional ? '*' : ''}
                </td>
                <td class="px-3.5 py-2.5">
                  <code class="text-xs text-muted-foreground font-mono px-1.5 py-0.5 border border-border/40 rounded-md bg-muted/70">
                    {normalizeType(prop.type)}
                  </code>
                </td>
                <td class="text-xs text-muted-foreground px-3.5 py-2.5">
                  <Show
                    when={prop.defaultValue !== undefined}
                    fallback={<span class="text-muted-foreground/60">—</span>}
                  >
                    <code class="font-mono px-1.5 py-0.5 border border-border/40 rounded-md bg-muted/70">
                      {prop.defaultValue}
                    </code>
                  </Show>
                </td>
                <td class="text-xs text-muted-foreground leading-relaxed px-3.5 py-2.5">
                  <Show when={prop.description} fallback="—">
                    {(description) => (
                      <div
                        // oxlint-disable-next-line subf/solid-no-innerhtml
                        innerHTML={description()}
                      />
                    )}
                  </Show>
                </td>
              </tr>
            )}
          </For>
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

  return (
    <section class="mt-6">
      <HeadingWithAnchor id={props.id ?? `${props.part.id}-dom-styling`} level={props.headingLevel}>
        DOM &amp; Styling
      </HeadingWithAnchor>

      <h4 class="text-xs text-foreground tracking-wider font-bold mt-4 uppercase">Anatomy</h4>
      <Show
        when={props.part.rendersDom}
        fallback={<p class="text-sm text-muted-foreground">This part does not render DOM.</p>}
      >
        <Show when={props.part.anatomy?.length}>
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
      </Show>

      <Show
        when={
          props.part.dataAttributes?.length ||
          props.part.accessibility?.length ||
          props.part.cssVariables?.length
        }
      >
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
    </section>
  )
}

function PropsSection(props: {
  part: PresentationPartSection
  headingLevel: number
  id?: string
}): JSX.Element {
  return (
    <Show when={props.part.propGroups.length > 0}>
      <HeadingWithAnchor id={props.id ?? `${props.part.id}-props`} level={props.headingLevel}>
        Props
      </HeadingWithAnchor>
      <For each={props.part.propGroups}>
        {(group) => (
          <div class="mt-4">
            <h4 class="text-xs text-foreground tracking-wider font-bold mb-2 uppercase">
              {group.heading}
            </h4>
            <PropRows props={group.props} />
          </div>
        )}
      </For>
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
                    <DomStylingSection part={part()} headingLevel={3} id="dom-styling" />
                    <PropsSection part={part()} headingLevel={3} id="api-props" />
                  </>
                )}
              </Show>
            }
          >
            <For each={reference().parts}>
              {(part) => (
                <section>
                  <HeadingWithAnchor id={part.id} level={3}>
                    {part.heading}
                  </HeadingWithAnchor>
                  <Show when={part.accessText}>
                    {(accessText) => <code class="text-xs font-mono">{accessText()}</code>}
                  </Show>
                  <Show when={part.description}>
                    {(description) => <p class="text-sm text-muted-foreground">{description()}</p>}
                  </Show>
                  <DomStylingSection part={part} headingLevel={4} />
                  <PropsSection part={part} headingLevel={4} />
                </section>
              )}
            </For>
          </Show>

          <Show when={reference().item}>
            {(item) => (
              <section>
                <HeadingWithAnchor id={item().id} level={3}>
                  {item().heading}
                </HeadingWithAnchor>
                <PropRows props={item().props} nameColumn="Field" />
              </section>
            )}
          </Show>
        </>
      )}
    </Show>
  )
}
