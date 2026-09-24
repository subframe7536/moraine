import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { cn } from '../../../../../src'
import {
  DOCS_HEADING_ANCHOR_ARIA_LABEL,
  MARKDOWN_ANCHOR_HEADING_CLASS,
  MARKDOWN_ANCHOR_LINK_CLASS,
} from '../../../../build/markdown/shared.class'

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
