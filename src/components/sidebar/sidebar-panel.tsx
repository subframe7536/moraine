import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useMessages } from '../../provider/locale/locale-context'
import type { ValidComponent } from '../../shared/types'
import { Sheet } from '../sheet'

import { useSidebarContext, useSidebarStyles } from './sidebar-context'
import { defaultSidebarMessages } from './sidebar.messages'
import { sidebarDataAttributes } from './sidebar.recipe'
import type { SidebarT } from './sidebar.types'

/** Sidebar panel that renders inline on desktop and inside a Sheet on mobile. */
export function SidebarPanel<T extends ValidComponent = 'aside'>(
  props: SidebarT.PanelProps<T>,
): JSX.Element {
  const context = useSidebarContext()
  const [local, rest] = splitProps(props, ['as', 'aria-label', 'children', 'class', 'style'])
  const content = resolveChildren(() => local.children)
  const resolved = useSidebarStyles('panel', local)
  const messages = useMessages('sidebar', defaultSidebarMessages, () => context.translations?.())

  const mobileAriaLabel = () => {
    const restRecord = rest as Record<string, unknown>
    return local['aria-label'] ?? (restRecord.title as string | undefined) ?? messages().label
  }

  const PanelContent = (contentProps: { mobile: boolean }) => (
    <Dynamic
      component={(local.as ?? 'aside') as ValidComponent}
      id={context.panelId()}
      data-slot="sidebar-panel"
      {...sidebarDataAttributes.panel({
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
      {...resolved.slots.panel}
    >
      {content()}
    </Dynamic>
  )

  return (
    <Show when={context.isMobile()} fallback={<PanelContent mobile={false} />}>
      <Sheet
        open={context.isOpen()}
        onOpenChange={context.setOpen}
        side={context.side}
        closable={false}
      >
        <Sheet.Content aria-label={mobileAriaLabel()}>
          <Sheet.Body>
            <PanelContent mobile />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    </Show>
  )
}
