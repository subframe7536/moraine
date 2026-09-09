import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'

import type { SeparatorProps } from './separator.types.ts'

/** Visual divider with configurable orientation, style, and border type. */
export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['decorative', 'orientation', 'class', 'style'])
  const merged = mergeProps({ orientation: 'horizontal' as const }, local)
  const resolved = createComponentStyles('separator', merged)

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
