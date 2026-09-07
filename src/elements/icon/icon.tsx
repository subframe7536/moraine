import type { JSX, ValidComponent } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'

import type { IconProps } from './icon.types.ts'

export * from './icon.types.ts'

/** Renders an icon from a UnoCSS icon class, JSX element, or render function. */
export function Icon(props: IconProps): JSX.Element {
  const design = useMoraineDesign()
  const iconDesign = () => design().icon

  const [local, , rest] = splitProps(
    props,
    ['name', 'class', 'style', 'size', 'slotName'],
    ['classes', 'styles'],
  )
  const name = createMemo(() => local.name)

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return iconDesign()?.recipe()
      },
    },
    base: {
      get classes() {
        const value = name()
        return { root: typeof value === 'string' ? value : undefined }
      },
      get styles() {
        return {
          root: {
            'font-size': typeof local.size === 'number' ? `${local.size}px` : local.size,
          },
        }
      },
    },
    get instance() {
      return {
        class: local.class,
        style: local.style,
      }
    },
  })

  const componentProps = createMemo<{ component: ValidComponent }>(() => {
    const value = name()

    if (typeof value === 'string') {
      return { component: 'div' }
    }

    return {
      component: typeof value === 'function' ? value : () => value,
    }
  })

  return (
    <Dynamic
      data-slot={local.slotName ?? 'icon'}
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
      {...componentProps()}
      {...resolved.rootClassAndStyle()}
    />
  )
}
