import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider'

import type { SeparatorProps } from './separator.types'

/** Visual divider with configurable orientation, style, and border type. */
export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['decorative', 'orientation', 'class', 'style'])
  const resolved = createComponentStyles('separator', local)
  const merged = mergeProps(
    {
      get orientation() {
        return resolved.variants.orientation ?? 'horizontal'
      },
    },
    local,
  )

  return (
    <div
      role="separator"
      data-slot="root"
      aria-orientation={merged.orientation}
      aria-hidden={local.decorative ? true : undefined}
      {...rest}
      {...resolved.root}
    />
  )
}
