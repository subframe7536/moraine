import type { JSX } from '@solidjs/web'
import { isServer } from '@solidjs/web'
import { createEffect, Show, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { createKeyDownHandler } from '../../shared/keyboard'
import type { ValidComponent } from '../../shared/types'
import { createId } from '../../shared/utils'
import { Icon } from '../icon'
import { resolveDirection } from '../shared/overlay/direction'
import { PopperTrigger, mergePopperElementProps } from '../shared/overlay/popper'

import {
  isMousePointer,
  useNavigationMenuContext,
  useNavigationMenuItemContext,
} from './navigation-menu-context'
import {
  NAVIGATION_MENU_FOCUS_GUARD_CLASS,
  navigationMenuControlData,
  navigationMenuDataAttributes,
  navigationMenuFocusGuardData,
  navigationMenuRecipe,
} from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'
/**
 * Button that opens the `NavigationMenu.Content` panel of the surrounding `NavigationMenu.Item`
 * on hover, click, or keyboard, and shows a chevron icon after its children. It must be placed
 * inside `NavigationMenu.Item`. Renders a `button`; pass `as` to render another component.
 *
 * @example
 * ```tsx
 * import { NavigationMenu } from 'moraine'
 *
 * <NavigationMenu aria-label="Main navigation">
 *   <NavigationMenu.List>
 *     <NavigationMenu.Item value="products">
 *       <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
 *       <NavigationMenu.Content>
 *         <NavigationMenu.Link href="/overview">Overview</NavigationMenu.Link>
 *       </NavigationMenu.Content>
 *     </NavigationMenu.Item>
 *   </NavigationMenu.List>
 * </NavigationMenu>
 * ```
 */
export function NavigationMenuTrigger<T extends ValidComponent = 'button'>(
  props: NavigationMenuT.TriggerProps<T>,
): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const item = useNavigationMenuItemContext()
  if (!item) {
    throw new Error('NavigationMenu.Trigger must be used within NavigationMenu.Item')
  }
  // Server rendering is pure, so the trigger registers its options with the item on the client.
  if (!isServer) {
    createEffect(
      () => undefined,
      () => {
        item.setTriggerOptions(props)
        return () => item.setTriggerOptions(undefined)
      },
      { transparent: true },
    )
  }
  const local = props as NavigationMenuT.TriggerProps<T> & { id?: string }
  const rest = omit(
    props as NavigationMenuT.TriggerProps<T> & { id?: string },
    'as',
    'id',
    'disabled',
    'children',
    'class',
    'style',
  )
  const {
    slots: { trigger: triggerSlot, triggerIcon: triggerIconSlot },
  } = useRecipe(navigationMenuRecipe, local, {
    slot: 'trigger',
    data: { triggerIcon: navigationMenuDataAttributes.triggerIcon(() => ({ expanded })) },
    context: () => ({
      variants: { orientation: context.orientation() },
      classes: context.options.classes,
      styles: context.options.styles,
    }),
  })
  const triggerId = createId(() => local.id, 'navigation-menu-trigger')
  const disabled = item.disabled
  const expanded = () => context.open() && context.activeItem() === item
  const toggleExpandedFromKeyboard = () => {
    if (expanded()) {
      context.close()
    } else {
      context.openItem(item.value(), true)
    }
  }
  const attributes = mergePopperElementProps<HTMLButtonElement>(
    {
      onPointerEnter: (event) => {
        if (isMousePointer(event) && !disabled()) {
          context.scheduleOpen(item.value())
        }
      },
      onPointerLeave: (event) => {
        if (isMousePointer(event)) {
          context.scheduleClose(event)
        }
      },
      onPointerDown: context.cancelTimers,
      onKeyDown: createKeyDownHandler<HTMLButtonElement>({
        disabled,
        orientation: () => context.orientation(),
        direction: (event) => resolveDirection(event.currentTarget, direction()),
        keys: {
          open: () => context.openItem(item.value(), true),
          Enter: toggleExpandedFromKeyboard,
          ' ': toggleExpandedFromKeyboard,
        },
        onUnhandled: (event) => context.onListKeyDown(event, event.currentTarget),
      }),
    },
    rest,
  )
  return (
    <>
      <PopperTrigger
        as={local.as as ValidComponent}
        {...attributes}
        context={{
          options: context.options,
          slotName: (slot) => `navigation-menu-${slot}`,
          contentId: () => `${context.id()}-${item.value()}-content`,
          isOpen: expanded,
          setOpen: (open) => {
            if (open) {
              context.openItem(item.value())
            } else {
              context.close()
            }
          },
          triggerElement: item.trigger,
          setTriggerElement: (element) => item.setTrigger(element as HTMLButtonElement | undefined),
          contentPresence: { present: expanded },
        }}
        type="button"
        id={triggerId()}
        disabled={disabled()}
        aria-haspopup={'false'}
        {...navigationMenuControlData}
        {...triggerSlot}
      >
        {local.children}
        <Icon
          name="icon-chevron-down"
          data-slot="navigation-menu-trigger-icon"
          {...triggerIconSlot}
        />
      </PopperTrigger>
      <Show when={expanded()}>
        <span
          tabindex={0}
          {...navigationMenuFocusGuardData}
          aria-hidden="true"
          class={NAVIGATION_MENU_FOCUS_GUARD_CLASS}
          onFocus={context.onFocusGuard}
        />
      </Show>
    </>
  )
}
