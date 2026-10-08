import type { JSX } from 'solid-js'
import { children as resolveChildren, createMemo, Show, splitProps } from 'solid-js'

import { Collapsible } from '../../element/collapsible'
import { useCollapsibleContext } from '../../element/collapsible/collapsible-context'
import type { IconT } from '../../element/icon'
import { Icon } from '../../element/icon'
import type { ValidComponent } from '../../shared/types'
import { callHandler } from '../../shared/utils'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import { SidebarFrameItem } from './sidebar-frame-item'
import { sidebarFrameDataAttributes } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

const DEFAULT_SUBMENU_TRAILING: IconT.Name = 'i-lucide:chevron-right'

/** Interactive trigger for expanding or collapsing sidebar sub-navigation. */
export function SidebarFrameSubmenuTrigger<T extends ValidComponent = 'button'>(
  props: SidebarFrameT.SubmenuTriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'children',
    'class',
    'leading',
    'style',
    'trailing',
  ])

  const resolved = useSidebarFrameStyles('submenuTrigger', local)
  const disclosure = useCollapsibleContext().disclosure

  const trailingIcon = () => local.trailing ?? DEFAULT_SUBMENU_TRAILING
  const children = resolveChildren(() => local.children)
  const hasChildren = createMemo(() => {
    const value = children()
    return value === 0 || Boolean(value)
  })

  const onClick = (event: MouseEvent) => {
    callHandler(
      event,
      (rest as { onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent> }).onClick,
    )
  }

  return (
    <Show
      when={hasChildren()}
      fallback={
        <Collapsible.Trigger
          as={(local.as ?? 'button') as ValidComponent}
          data-slot="sidebar-frame-submenu-trigger"
          {...rest}
          {...resolved.styles.submenuTrigger}
          onClick={onClick}
        >
          <Icon
            name={trailingIcon()}
            {...resolved.styles.itemTrailing}
            aria-hidden={true}
            {...sidebarFrameDataAttributes.itemTrailing({
              expanded: () => disclosure.open(),
            })}
          />
        </Collapsible.Trigger>
      }
    >
      <SidebarFrameItem
        as={Collapsible.Trigger}
        data-slot="sidebar-frame-submenu-trigger"
        leading={local.leading}
        trailing={trailingIcon()}
        {...rest}
        class={local.class}
        style={local.style}
        onClick={onClick}
      >
        {children()}
      </SidebarFrameItem>
    </Show>
  )
}
