import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider'

import type { SeparatorProps } from './separator.types'

/** Semantic divider with configurable horizontal or vertical orientation. */
export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['orientation', 'class', 'style', 'classes', 'styles'])
  const resolved = createComponentStyles('separator', local)
  const orientation = () => resolved.variants.orientation ?? 'horizontal'

  return (
    <div
      data-slot="root"
      {...rest}
      role="separator"
      aria-orientation={orientation()}
      data-orientation={orientation()}
      {...resolved.root}
    />
  )
}
