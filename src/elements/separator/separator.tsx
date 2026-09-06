import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'

import type { SeparatorProps } from './separator.types.ts'

export * from './separator.types.ts'

/** Visual divider with configurable orientation, style, and border type. */
export function Separator(props: SeparatorProps): JSX.Element {
  const design = useMoraineDesign()
  const separatorDesign = () => design().separator

  const [local, , rest] = splitProps(
    props,
    ['decorative', 'orientation', 'size', 'type', 'class', 'style'],
    ['classes', 'styles'],
  )

  const orientation = createMemo<NonNullable<SeparatorProps['orientation']>>(
    () => local.orientation ?? separatorDesign()?.defaultVariants?.orientation ?? 'horizontal',
  )
  const size = createMemo<NonNullable<SeparatorProps['size']>>(
    () => local.size ?? separatorDesign()?.defaultVariants?.size ?? 'sm',
  )
  const type = createMemo<NonNullable<SeparatorProps['type']>>(
    () => local.type ?? separatorDesign()?.defaultVariants?.type ?? 'solid',
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return separatorDesign()?.recipe({
          orientation: orientation(),
          size: size(),
          type: type(),
        })
      },
    },
    get instance() {
      return {
        class: local.class,
        style: local.style,
      }
    },
  })

  return (
    <div
      role="separator"
      data-slot="root"
      data-orientation={orientation()}
      aria-orientation={orientation()}
      aria-hidden={local.decorative ? true : undefined}
      {...rest}
      {...resolved.rootClassAndStyle()}
    />
  )
}
