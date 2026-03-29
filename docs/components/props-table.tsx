import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'

import type { PropDoc } from '../vite-plugin/api-doc/types'
import {
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from '../vite-plugin/markdown/const'

export const API_HEADING_PROSE_CLASS =
  'max-w-none prose prose-neutral prose-headings:(text-foreground font-semibold mb-1 mt-6) dark:prose-invert'

export interface PropsTableProps {
  sections: PropsTableSection[]
}

export interface InheritedGroupDoc {
  from: string
  props: PropDoc[]
}

export interface ComponentPropsDoc {
  own: PropDoc[]
  inherited: InheritedGroupDoc[]
}

export interface PropsTableSection {
  id: string
  heading: string
  description?: string
  props: PropDoc[]
  groups?: {
    description: string
    props: PropDoc[]
  }[]
}

export function PropsTable(props: PropsTableProps): JSX.Element {
  return (
    <div class="bg-background flex flex-col gap-4">
      <For each={props.sections}>{(section) => <SectionTableBlock section={section} />}</For>
    </div>
  )
}

function normalizeType(type: string): string {
  let result = type
  result = result.replaceAll('cls_variant0.', '')
  return result
}

function PropRows(tableProps: { props: PropDoc[] }): JSX.Element {
  return (
    <div class="my-6 b-1 b-border rounded-lg overflow-x-auto">
      <table class="text-sm m-0 w-full border-collapse">
        <thead>
          <tr class="text-xs text-muted-foreground tracking-wider text-left bg-muted uppercase">
            <th class="font-medium px-3 py-2">Prop</th>
            <th class="font-medium px-3 py-2">Type</th>
            <th class="font-medium px-3 py-2">Default</th>
            <th class="font-medium px-3 py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          <For each={tableProps.props}>
            {(prop) => (
              <tr class="b-t b-border hover:bg-muted/50">
                <td class="text-xs text-primary font-mono px-3 py-2 whitespace-nowrap">
                  {prop.name}
                  {prop.required ? '*' : ''}
                </td>
                <td class="px-3 py-2">
                  <code class="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                    {normalizeType(prop.type)}
                  </code>
                </td>
                <td class="text-xs text-muted-foreground px-3 py-2">
                  <Show
                    when={prop.defaultValue}
                    fallback={<span class="text-muted-foreground/80">—</span>}
                  >
                    <code class="px-1.5 py-0.5 rounded bg-muted">{prop.defaultValue}</code>
                  </Show>
                </td>
                <td class="text-muted-foreground px-3 py-2">
                  <Show
                    when={prop.description}
                    fallback={<span class="text-muted-foreground/80">—</span>}
                  >
                    {prop.description}
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

function SectionTableBlock(sectionProps: { section: PropsTableSection }): JSX.Element {
  return (
    <div class={API_HEADING_PROSE_CLASS}>
      <h3 id={sectionProps.section.id} class={MARKDOWN_ANCHOR_HEADING_CLASS}>
        {sectionProps.section.heading}
        <a
          href={`#${sectionProps.section.id}`}
          class={MARKDOWN_ANCHOR_LINK_CLASS}
          aria-label={`Link to ${sectionProps.section.heading}`}
        >
          #
        </a>
      </h3>

      <Show when={sectionProps.section.description}>
        {(description) => <p class="text-sm text-muted-foreground">{description()}</p>}
      </Show>

      <Show
        when={sectionProps.section.groups?.length}
        fallback={<PropRows props={sectionProps.section.props} />}
      >
        <For each={sectionProps.section.groups}>
          {(group) => (
            <>
              <p class="text-sm text-muted-foreground">{group.description}</p>
              <PropRows props={group.props} />
            </>
          )}
        </For>
      </Show>
    </div>
  )
}
