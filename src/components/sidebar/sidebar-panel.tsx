import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useMessages } from '../../provider/locale/locale-context'
import { bindElement, publishElement } from '../../shared/element-binding'
import type { ValidComponent } from '../../shared/types'
import { callRef } from '../../shared/utils'
import { Drawer } from '../drawer'

import { useSidebarContext, useSidebarStyles } from './sidebar-context'
import { defaultSidebarMessages } from './sidebar.messages'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'

/** Sidebar panel that renders inline on desktop and inside a Drawer on mobile. */
export function SidebarPanel<T extends ValidComponent = 'aside'>(
  props: SidebarT.PanelProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const [local, rest] = splitProps(props, ['as', 'aria-label', 'children', 'class', 'style', 'ref'])
  const content = resolveChildren(() => local.children)
  const { slotWith } = useSidebarStyles('panel', local)
  const messages = useMessages('sidebar', defaultSidebarMessages, () => context.translations?.())

  const mobileAriaLabel = () =>
    local['aria-label'] ?? (rest as { title?: string }).title ?? messages().label

  // The mobile Drawer owns presence, so only the inline desktop panel reflects the closed state.
  const PanelContent = (contentProps: { mobile: boolean }) => {
    const closed = () => !contentProps.mobile && !context.isOpen()
    const [element, setElement] = createSignal<HTMLElement>()
    // Publish only the inline panel so `Rail` can measure it, even while closed.
    const publishedElement = () => (contentProps.mobile ? undefined : element())
    bindElement(publishedElement, publishElement(context.panelElement, context.setPanelElement))
    const panelSlot = slotWith('panel', {
      data: sidebarDataAttributes.panel({
        closed,
        expanded: () => !closed(),
        mobile: () => contentProps.mobile,
        resizing: context.resizing,
        side: () => context.side,
        variant: () => context.variant,
      }),
    })
    return (
      <Dynamic
        component={(local.as ?? 'aside') as ValidComponent}
        data-slot="sidebar-panel"
        {...panelSlot}
        ref={(node: HTMLElement) => {
          setElement(node)
          callRef(local.ref, node)
        }}
        aria-hidden={closed() ? true : undefined}
        inert={closed() ? true : undefined}
        aria-label={local['aria-label']}
        {...(rest as object)}
        id={context.panelId()}
      >
        {content()}
      </Dynamic>
    )
  }

  return (
    <Show when={context.isMobile()} fallback={<PanelContent mobile={false} />}>
      <Drawer
        open={context.isOpen()}
        onOpenChange={context.setOpen}
        side={context.side}
        closable={false}
      >
        <Drawer.Content aria-label={mobileAriaLabel()}>
          <PanelContent mobile />
        </Drawer.Content>
      </Drawer>
    </Show>
  )
}
