import type { JSX } from 'solid-js'
import { onCleanup, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerDataAttributes, drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'

export function DrawerFooter<T extends ValidComponent = 'div'>(
  props: DrawerT.FooterProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  const unregister = content.registerFooter()
  onCleanup(unregister)
  const {
    slots: { footer: footerSlot },
  } = useRecipe(drawerRecipe, local, {
    slot: 'footer',
    data: { footer: drawerDataAttributes.footer({ body: content.hasBody }) },
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  return (
    <Dynamic component={local.as ?? 'div'} data-slot="drawer-footer" {...footerSlot} {...rest} />
  )
}
