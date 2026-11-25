import type { JSX } from '@solidjs/web'
import { dynamic, isServer } from '@solidjs/web'
import { Show, createRenderEffect, createSignal, onCleanup, omit } from 'solid-js'

import { useMessages } from '../../provider/locale/locale-context'
import { bindElement, publishElement } from '../../shared/element-binding'
import type { ValidComponent } from '../../shared/types'
import { callRef, pick, resolvePropsChildren } from '../../shared/utils'
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
 *   <Sidebar.Panel aria-label="Main navigation">
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
  const local = pick(
    props as SidebarT.PanelProps,
    'as',
    'aria-label',
    'children',
    'class',
    'id',
    'style',
    'ref',
  )
  const rest = omit(
    props as SidebarT.PanelProps,
    'as',
    'aria-label',
    'children',
    'class',
    'id',
    'style',
    'ref',
  )
  // Registered during setup so `Trigger` and `Rail` reference the same id in `aria-controls`.
  // Server rendering is pure, so the server renders the panel with its own id and registers
  // nothing; the client registers it while hydrating.
  if (!isServer) {
    createRenderEffect(
      () => local.id,
      (id) => {
        context.setPanelId(id)
      },
      { transparent: true },
    )
    onCleanup(() => context.setPanelId(undefined))
  }
  const content = resolvePropsChildren(props)
  const { slotWith } = useSidebarStyles('panel', local)
  const messages = useMessages('sidebar', defaultSidebarMessages, () => context.translations?.())

  const mobileAriaLabel = () =>
    local['aria-label'] ?? (rest as { title?: string }).title ?? messages().label

  const Root = dynamic<ValidComponent>(() => local.as ?? 'aside')

  // The mobile Drawer owns presence, so only the inline desktop panel reflects the closed state.
  const PanelContent = (contentProps: { mobile: boolean }) => {
    const closed = () => !contentProps.mobile && !context.open()
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
      <Root
        data-slot="sidebar-panel"
        {...panelSlot}
        ref={(node: HTMLElement) => {
          setElement(node)
          callRef(() => local.ref, node)
        }}
        aria-hidden={closed() ? 'true' : undefined}
        {...{ 'prop:inert': closed() ? true : undefined }}
        aria-label={local['aria-label']}
        {...(rest as object)}
        id={local.id ?? context.panelId()}
      >
        {content()}
      </Root>
    )
  }

  return (
    <Show when={context.mobile()} fallback={<PanelContent mobile={false} />}>
      <Drawer
        open={context.open()}
        onOpenChange={context.setOpen}
        side={context.drawerSide()}
        closable={false}
      >
        <Drawer.Content aria-label={mobileAriaLabel()}>
          <PanelContent mobile />
        </Drawer.Content>
      </Drawer>
    </Show>
  )
}
