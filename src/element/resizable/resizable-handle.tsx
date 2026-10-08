import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'

import type { ResizableT } from './resizable.types'

export const RESIZABLE_HANDLE_PART = /* @__PURE__ */ Symbol('Resizable.Handle')

export function ResizableHandle(props: ResizableT.HandleProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'action',
    'intersection',
    'children',
    'class',
    'style',
    'ref',
    'onMouseEnter',
    'onMouseLeave',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onPointerDown',
    'onClick',
    'aria-label',
  ])
  const content = createMemo(() => local.children)

  return {
    kind: RESIZABLE_HANDLE_PART,
    local,
    rest,
    content,
  } as unknown as JSX.Element
}
