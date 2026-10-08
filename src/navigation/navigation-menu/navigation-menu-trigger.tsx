import type { JSX } from 'solid-js'
import { Show, onCleanup, splitProps } from 'solid-js'

import { Icon } from '../../element/icon'
import { PopperTrigger, mergePopperElementProps } from '../../overlay/base/popper'
import { resolveDirection } from '../../overlay/base/utils'
import { createStyles } from '../../provider'
import { useLocale } from '../../provider/locale/locale-context'
import { createId } from '../../shared/utils'

import {
  isMousePointer,
  useNavigationMenuContext,
  useNavigationMenuItemContext,
} from './navigation-menu-context'
import {
  NAVIGATION_MENU_FOCUS_GUARD_CLASS,
  navigationMenuDataAttributes,
  navigationMenuRecipe,
} from './navigation-menu.recipe'
import type { NavigationMenuT } from './navigation-menu.types'

export function NavigationMenuTrigger(props: NavigationMenuT.TriggerProps): JSX.Element {
  const context = useNavigationMenuContext()
  const direction = useLocale().dir
  const item = useNavigationMenuItemContext()
  item.setTriggerOptions(props)
  onCleanup(() => item.setTriggerOptions(undefined))
  const [local, rest] = splitProps(props, [
    'id',
    'disabled',
    'children',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const resolved = createStyles(navigationMenuRecipe, local, {
    rootSlot: 'trigger',
    inheritedStyles: () => context.options,
    inheritedVariants: () => ({ orientation: context.orientation() }),
  })
  const triggerId = createId(() => local.id, 'navigation-menu-trigger')
  const disabled = item.disabled
  const expanded = () => context.open() && context.activeItem() === item
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
      onKeyDown: (event) => {
        if (disabled() || event.isComposing) {
          return
        }
        const openKey =
          context.orientation() === 'horizontal'
            ? 'ArrowDown'
            : resolveDirection(event.currentTarget, direction()) === 'rtl'
              ? 'ArrowLeft'
              : 'ArrowRight'
        if (event.key === openKey) {
          event.preventDefault()
          context.openItem(item.value(), true)
        } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault()
          if (expanded()) {
            context.close()
          } else {
            context.openItem(item.value(), true)
          }
        } else {
          context.onListKeyDown(event, event.currentTarget)
        }
      },
    },
    rest,
  )
  return (
    <>
      <PopperTrigger
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
        aria-haspopup={false}
        data-moraine-navigation-menu-control=""
        {...resolved.styles.trigger}
      >
        {local.children}
        <Icon
          name="icon-chevron-down"
          data-slot="navigation-menu-trigger-icon"
          {...navigationMenuDataAttributes.triggerIcon({ expanded })}
          {...resolved.styles.triggerIcon}
        />
      </PopperTrigger>
      <Show when={expanded()}>
        <span
          tabIndex={0}
          data-moraine-navigation-menu-focus-guard=""
          aria-hidden="true"
          class={NAVIGATION_MENU_FOCUS_GUARD_CLASS}
          onFocus={context.onFocusGuard}
        />
      </Show>
    </>
  )
}
