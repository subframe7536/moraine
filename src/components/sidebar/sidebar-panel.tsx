import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createRenderEffect,
  createSignal,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'
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

/**
 * Container for the sidebar's regions. Renders an `aside` inline on desktop and moves the same
 * content into a mobile `Drawer` on smaller viewports, so keep one navigation tree inside it. Place
 * it directly inside `Sidebar`, before `Sidebar.Inset`.
 *
 * @example
 * ```tsx
 * import { Sidebar } from 'moraine'
 *
 * <Sidebar>
 *   <Sidebar.Panel ariaLabel="Main navigation">
 *     <Sidebar.Content>Navigation</Sidebar.Content>
 *   </Sidebar.Panel>
 *   <Sidebar.Inset>Content</Sidebar.Inset>
 * </Sidebar>
 * ```
 */
export function SidebarPanel<T extends ValidComponent = 'aside'>(
  props: SidebarT.PanelProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const [local, rest] = splitProps(props, [
    'as',
    'ariaLabel',
    'children',
    'class',
    'id',
    'style',
    'ref',
  ])
  // Registered during setup so `Trigger` and `Rail` reference the same id in `aria-controls`.
  createRenderEffect(on(() => local.id, context.setPanelId))
  onCleanup(() => context.setPanelId(undefined))
  const content = resolveChildren(() => local.children)
  const { slotWith } = useSidebarStyles('panel', local)
  const messages = useMessages('sidebar', defaultSidebarMessages, () => context.translations?.())

  const mobileAriaLabel = () =>
    local.ariaLabel ?? (rest as { title?: string }).title ?? messages().label

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
        aria-label={local.ariaLabel}
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
