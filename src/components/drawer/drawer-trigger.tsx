import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'

import { useDrawerContext } from './drawer-context'
import { drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'

export function DrawerTrigger<T extends ValidComponent = 'button'>(
  props: DrawerT.TriggerProps<T>,
): JSX.Element {
  const drawer = useDrawerContext()
  const [local, rest] = splitProps(props as DrawerT.TriggerProps, ['class', 'style'])
  const {
    slots: { trigger: triggerSlot },
  } = useRecipe(drawerRecipe, local, {
    slot: 'trigger',
    context: () => drawer.slotOverrides,
  })
  return <Modal.Trigger data-slot="drawer-trigger" {...triggerSlot} {...rest} />
}
