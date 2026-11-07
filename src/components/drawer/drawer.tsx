import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { Modal } from '../modal/modal'
import { MODAL_ROOT_KEYS } from '../modal/modal-context'

import { DrawerBody } from './drawer-body'
import { DrawerClose } from './drawer-close'
import { DrawerContent } from './drawer-content'
import type { DrawerContextValue } from './drawer-context'
import {
  createDrawerNestedChannel,
  DrawerProvider,
  useOptionalDrawerContext,
} from './drawer-context'
import { DrawerDescription } from './drawer-description'
import { DrawerFooter } from './drawer-footer'
import { DrawerHeader } from './drawer-header'
import { DrawerTitle } from './drawer-title'
import { DrawerTrigger } from './drawer-trigger'
import type { DrawerProps, DrawerT } from './drawer.types'

/** Sheet-like surface with swipe-to-dismiss gestures and snap points. */
export function Drawer(props: DrawerProps): JSX.Element {
  const [modalProps, drawerProps] = splitProps(props, MODAL_ROOT_KEYS)
  const defaultSnapPoint = (): DrawerT.SnapPoint | null =>
    drawerProps.defaultSnapPoint ?? drawerProps.snapPoints?.[0] ?? null
  const [snapPoint, setSnapPoint] = createControllableValue<DrawerT.SnapPoint | null>({
    value: () => drawerProps.snapPoint,
    defaultValue: defaultSnapPoint,
    onChange: (next) => drawerProps.onSnapPointChange?.(next),
  })
  const nested = createDrawerNestedChannel(useOptionalDrawerContext()?.nested)
  const context: DrawerContextValue = mergeProps(drawerProps, {
    snapPoint,
    setSnapPoint,
    nested,
    get closeOnEscape() {
      return props.closeOnEscape
    },
    get onClosePrevent() {
      return props.onClosePrevent
    },
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
  })
  return (
    <DrawerProvider value={context}>
      <Modal
        {...modalProps}
        onExitComplete={() => {
          // Restore the resting snap point once the drawer finished closing.
          setSnapPoint(defaultSnapPoint())
          modalProps.onExitComplete?.()
        }}
      />
    </DrawerProvider>
  )
}

Drawer.Trigger = DrawerTrigger
Drawer.Content = DrawerContent
Drawer.Header = DrawerHeader
Drawer.Title = DrawerTitle
Drawer.Description = DrawerDescription
Drawer.Body = DrawerBody
Drawer.Footer = DrawerFooter
Drawer.Close = DrawerClose
