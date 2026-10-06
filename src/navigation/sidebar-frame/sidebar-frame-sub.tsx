import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { Collapsible } from '../../element/collapsible'
import { useCollapsibleContext } from '../../element/collapsible/collapsible-context'
import type { IconT } from '../../element/icon'

import { useSidebarFrameStyles } from './sidebar-frame-context'
import { SidebarFrameItem } from './sidebar-frame-item'
import type { SidebarFrameT } from './sidebar-frame.types'

const DEFAULT_SUB_TRAILING: IconT.Name = 'i-lucide:chevron-right'

function SubTrigger(triggerProps: {
  triggerRender?: (props: SidebarFrameT.SubTriggerRenderProps) => JSX.Element
  label: JSX.Element
  leading?: SidebarFrameT.SubBase['leading']
  trailing?: SidebarFrameT.SubBase['trailing']
  disabled?: boolean
  href?: string
  isActive?: boolean
  triggerClass?: string
}): JSX.Element {
  const collapsible = useCollapsibleContext()
  const isDisabled = () => Boolean(triggerProps.disabled) || collapsible.disabled()
  const trailing = () => triggerProps.trailing ?? DEFAULT_SUB_TRAILING

  return (
    <Show
      when={triggerProps.triggerRender}
      fallback={
        <SidebarFrameItem
          as={Collapsible.Trigger}
          href={triggerProps.href}
          isActive={triggerProps.isActive}
          class={triggerProps.triggerClass}
          leading={triggerProps.leading}
          trailing={trailing()}
          disabled={isDisabled()}
        >
          {triggerProps.label}
        </SidebarFrameItem>
      }
    >
      {(render) =>
        render()({
          open: collapsible.open,
          get disabled() {
            return isDisabled()
          },
          label: triggerProps.label,
          leading: triggerProps.leading,
          get trailing() {
            return trailing()
          },
        })
      }
    </Show>
  )
}

/** Expandable submenu built on Collapsible for sidebar navigation. */
export function SidebarFrameSub(props: SidebarFrameT.SubProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'children',
    'class',
    'defaultOpen',
    'disabled',
    'href',
    'isActive',
    'label',
    'leading',
    'onOpenChange',
    'open',
    'style',
    'trailing',
    'transition',
    'triggerClass',
    'triggerRender',
    'unmountOnHide',
  ])

  const resolved = useSidebarFrameStyles('sub', local)

  return (
    <Collapsible
      open={local.open}
      defaultOpen={local.defaultOpen}
      onOpenChange={local.onOpenChange}
      disabled={local.disabled}
      transition={local.transition}
      unmountOnHide={local.unmountOnHide}
      data-slot="sidebar-frame-sub"
      class={resolved.styles.sub.class}
      style={resolved.styles.sub.style}
      {...rest}
    >
      <SubTrigger
        triggerRender={local.triggerRender}
        label={local.label}
        leading={local.leading}
        trailing={local.trailing}
        disabled={local.disabled}
        href={local.href}
        isActive={local.isActive}
        triggerClass={local.triggerClass}
      />
      <Collapsible.Content
        as="div"
        data-slot="sidebar-frame-sub-content"
        {...resolved.styles.subContent}
      >
        {local.children}
      </Collapsible.Content>
    </Collapsible>
  )
}
