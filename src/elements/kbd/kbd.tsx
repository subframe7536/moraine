import type { JSX } from 'solid-js'
import { Show, createMemo, splitProps } from 'solid-js'

import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'

import { KBD_KEY_ALIASES } from './kbd.types.ts'
import type { KbdProps, KbdT } from './kbd.types.ts'

export * from './kbd.types.ts'

/** Keyboard keycap component with configurable size, variant, and accessible label. */
export function Kbd(props: KbdProps): JSX.Element {
  const design = useMoraineDesign()
  const kbdDesign = () => design().kbd

  const [local, , rest] = splitProps(
    props,
    ['value', 'label', 'symbol', 'slotName', 'size', 'variant', 'class', 'style'],
    ['classes', 'styles'],
  )

  const size = () => local.size ?? kbdDesign()?.defaultVariants?.size ?? 'md'
  const variant = () => local.variant ?? kbdDesign()?.defaultVariants?.variant ?? 'default'

  const alias = createMemo(() =>
    local.symbol === false
      ? undefined
      : KBD_KEY_ALIASES[local.value.toLowerCase() as KbdT.BuiltinKbds],
  )
  const text = createMemo(() => alias()?.text ?? local.value)

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return kbdDesign()?.recipe({ size: size(), variant: variant() })
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
    <Show when={text()}>
      <kbd
        data-slot={local.slotName ?? 'root'}
        aria-label={local.label ?? alias()?.label}
        {...rest}
        {...resolved.rootClassAndStyle()}
      >
        {text()}
      </kbd>
    </Show>
  )
}
