import { For, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Badge, cn } from '../../src'
import type { ItemsDoc } from '../vite-plugin/api-doc/types'
import {
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from '../vite-plugin/markdown/const'

import type { ExamplePageApiDoc } from './markdown'
import { API_HEADING_PROSE_CLASS, PropsTable } from './props-table'
import type { ComponentPropsDoc, PropsTableSection } from './props-table'

interface DocsApiReferenceProps {
  apiDoc?: ExamplePageApiDoc
}

interface AnchoredHeadingProps {
  id: string
  label: string
  class?: string
  level?: 2 | 3
}

function AnchoredHeading(props: AnchoredHeadingProps) {
  return (
    <Dynamic
      component={`h${props.level || 2}`}
      id={props.id}
      class={cn(MARKDOWN_ANCHOR_HEADING_CLASS, props.class)}
    >
      {props.label}
      <a
        href={`#${props.id}`}
        class={MARKDOWN_ANCHOR_LINK_CLASS}
        aria-label={`Link to ${props.label}`}
      >
        #
      </a>
    </Dynamic>
  )
}

function createInheritedSections(
  inheritedGroups: ComponentPropsDoc['inherited'],
  id: string,
): PropsTableSection[] {
  if (inheritedGroups.length === 0) {
    return []
  }

  return [
    {
      id,
      heading: 'Inherited',
      props: [],
      groups: inheritedGroups.map((group) => ({
        description: `From ${group.from}`,
        props: group.props,
      })),
    },
  ]
}

export const DocsApiReference = (props: DocsApiReferenceProps) => {
  const slots = () => props.apiDoc?.slots ?? []
  const propsDoc = () => props.apiDoc?.props ?? { own: [], inherited: [] }
  const itemsDoc = () => props.apiDoc?.items

  const hasMainSlots = () => slots().length > 0
  const hasMainProps = () => propsDoc().own.length > 0
  const hasMainItems = () => Boolean(itemsDoc())
  const hasMainInherited = () => propsDoc().inherited.length > 0
  const hasMainApiReference = () =>
    hasMainSlots() || hasMainProps() || hasMainItems() || hasMainInherited()

  const mainPropSections = (): PropsTableSection[] => {
    const sections: PropsTableSection[] = []
    const currentItemsDoc = itemsDoc()

    if (hasMainProps()) {
      sections.push({
        id: 'api-props',
        heading: 'Props',
        props: propsDoc().own,
      })
    }

    if (hasMainItems()) {
      sections.push({
        id: 'api-items',
        heading: 'Items',
        description: (currentItemsDoc as ItemsDoc | undefined)?.description,
        props: (currentItemsDoc as ItemsDoc | undefined)?.props ?? [],
      })
    }

    if (hasMainInherited()) {
      sections.push(...createInheritedSections(propsDoc().inherited, 'api-inherited'))
    }

    return sections
  }

  return (
    <Show when={hasMainApiReference()}>
      <Show when={hasMainSlots()}>
        <div class={API_HEADING_PROSE_CLASS}>
          <AnchoredHeading id="api-slots" label="Slots" level={3} />
        </div>
        <div class="flex flex-wrap gap-2">
          <For each={slots()}>{(slot) => <Badge>{slot}</Badge>}</For>
        </div>
      </Show>

      <Show when={mainPropSections().length > 0}>
        <PropsTable sections={mainPropSections()} />
      </Show>
    </Show>
  )
}
