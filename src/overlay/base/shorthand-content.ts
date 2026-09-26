import type { JSX } from 'solid-js'

import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'

export function createShorthandContent(props: {
  readonly title?: JSX.Element
  readonly description?: JSX.Element
}) {
  const title = createLazyMemo(() => props.title)
  const description = createLazyMemo(() => props.description)

  return {
    title,
    description,
    hasContent: () => hasJsxContent(title()) || hasJsxContent(description()),
  }
}
