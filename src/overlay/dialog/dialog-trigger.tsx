import type { JSX } from 'solid-js'

import { createStyles } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { Modal } from '../modal/modal'
import { useModalContext } from '../modal/modal-context'

import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogTrigger<T extends ValidComponent = 'button'>(
  props: DialogT.TriggerProps<T>,
): JSX.Element {
  const family = useModalContext()
  const resolved = createStyles(dialogRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => family.presentation,
  })
  return <Modal.Trigger {...props} {...resolved.styles.trigger} />
}
