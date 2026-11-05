import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerDataAttributes, drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'

export function DrawerBody<T extends ValidComponent = 'div'>(
  props: DrawerT.BodyProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style'])
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  const {
    slots: { body: bodySlot },
  } = useRecipe(drawerRecipe, local, {
    slot: 'body',
    data: { body: drawerDataAttributes.body({ header: content.hasHeader }) },
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  return <Dynamic component={local.as ?? 'div'} data-slot="drawer-body" {...bodySlot} {...rest} />
}
