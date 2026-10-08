import type { JSX } from 'solid-js'
import { children as resolveChildren, splitProps } from 'solid-js'

import type { ResizableT } from './resizable.types'

export const RESIZABLE_PANEL_PART = /* @__PURE__ */ Symbol('Resizable.Panel')

export function ResizablePanel(props: ResizableT.PanelProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'min',
    'max',
    'resizable',
    'collapsible',
    'collapsibleMin',
    'onCollapse',
    'onExpand',
    'children',
    'class',
    'style',
    'ref',
    'onTransitionEnd',
    'onTransitionCancel',
  ])
  const content = resolveChildren(() => local.children)

  return {
    kind: RESIZABLE_PANEL_PART,
    local,
    rest,
    content,
  } as unknown as JSX.Element
}
