import type { JSX } from 'solid-js'
import { mergeProps, splitProps } from 'solid-js'

import { pickSlotOverrides } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { BaseDialog } from '../base-dialog/base-dialog'
import { BASE_DIALOG_ROOT_KEYS } from '../base-dialog/base-dialog-context'

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

/**
 * Edge surface the user dismisses with a swipe along its edge, optionally resting at snap points.
 * Use `Sheet` for an edge panel without gestures, `Dialog` for a centered labeled task, and `BaseDialog`
 * to compose backdrop and content yourself. Open state is controlled with `open`/`onOpenChange` or
 * uncontrolled with `defaultOpen`, and `side` defaults to `bottom`.
 *
 * @example
 * ```tsx
 * import { Button, Drawer } from 'moraine'
 *
 * <Drawer>
 *   <Drawer.Trigger as={Button}>Open</Drawer.Trigger>
 *   <Drawer.Content title="Details">
 *     <Drawer.Body>Drawer content</Drawer.Body>
 *     <Drawer.Footer>
 *       <Drawer.Close as={Button}>Done</Drawer.Close>
 *     </Drawer.Footer>
 *   </Drawer.Content>
 * </Drawer>
 * ```
 */
export function Drawer(props: DrawerProps): JSX.Element {
  const [modalProps, drawerProps] = splitProps(props, BASE_DIALOG_ROOT_KEYS)
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
    get onClosePrevented() {
      return props.onClosePrevented
    },
    get slotOverrides() {
      return pickSlotOverrides(props)
    },
  })
  return (
    <DrawerProvider value={context}>
      <BaseDialog
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
