import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Sheet } from '../../overlay/sheet'
import { useMessages } from '../../provider/locale/locale-context'
import type { ValidComponent } from '../../shared/types'

import { useSidebarFrameContext, useSidebarFrameStyles } from './sidebar-frame-context'
import { defaultSidebarFrameMessages } from './sidebar-frame.messages'
import { sidebarFrameDataAttributes } from './sidebar-frame.recipe'
import type { SidebarFrameT } from './sidebar-frame.types'

export function SidebarFrameSidebar<T extends ValidComponent = 'aside'>(
  props: SidebarFrameT.SidebarProps<T>,
): JSX.Element {
  const context = useSidebarFrameContext()
  const [local, rest] = splitProps(props, [
    'as',
    'ariaLabel',
    'aria-label',
    'children',
    'class',
    'style',
  ])
  const content = resolveChildren(() => local.children)
  const resolved = useSidebarFrameStyles('sidebar', local)
  const messages = useMessages('sidebarFrame', defaultSidebarFrameMessages)

  const mobileAriaLabel = () => {
    const restRecord = rest as Record<string, unknown>
    return (
      local['aria-label'] ??
      local.ariaLabel ??
      (restRecord.title as string | undefined) ??
      messages().label
    )
  }

  const SidebarContent = (contentProps: { mobile: boolean }) => (
    <Dynamic
      component={(local.as ?? 'aside') as ValidComponent}
      id={context.sidebarId()}
      data-slot="sidebar-frame-sidebar"
      {...sidebarFrameDataAttributes.sidebar({
        closed: () => !context.isOpen(),
        expanded: () => context.isOpen(),
        mobile: () => contentProps.mobile,
        side: () => context.side,
        variant: () => context.variant,
      })}
      aria-hidden={!context.isOpen() ? true : undefined}
      inert={!contentProps.mobile && !context.isOpen() ? true : undefined}
      aria-label={local['aria-label']}
      {...(rest as object)}
      {...resolved.styles.sidebar}
    >
      {content()}
    </Dynamic>
  )

  return (
    <Show when={context.isMobile()} fallback={<SidebarContent mobile={false} />}>
      <Sheet
        open={context.isOpen()}
        onOpenChange={context.setOpen}
        side={context.side}
        close={false}
        ariaLabel={mobileAriaLabel()}
      >
        <Sheet.Content>
          <Sheet.Body>
            <SidebarContent mobile />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    </Show>
  )
}
