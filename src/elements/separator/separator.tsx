import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider/index.ts'

import type { SeparatorProps } from './separator.types.ts'

export * from './separator.types.ts'

/** Visual divider with configurable orientation, style, and border type. */
export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'decorative',
    'orientation',
    'size',
    'type',
    'class',
    'style',
  ])
  const resolved = createComponentStyles('separator', local)

  const orientation = createMemo<NonNullable<SeparatorProps['orientation']>>(
    () => local.orientation ?? 'horizontal',
  )

  return (
    <div
      role="separator"
      data-slot="root"
      data-orientation={orientation()}
      aria-orientation={orientation()}
      aria-hidden={local.decorative ? true : undefined}
      {...rest}
      {...resolved.root}
    />
  )
}
