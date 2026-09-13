import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { useCn } from '../../shared/provider'
import { callHandler, callRef } from '../../shared/utils'

import { useBaseSelectContext } from './base-select-context'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectListbox<TItem extends BaseSelectT.Item = BaseSelectT.Item>(
  props: BaseSelectT.ListboxProps<TItem>,
): JSX.Element {
  const context = useBaseSelectContext<TItem>()
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'children',
    'itemRender',
    'emptyRender',
    'class',
    'style',
    'ref',
  ])
  const listboxResolved = () => context.resolved.slot('listbox')

  return (
    <Show
      when={local.children !== undefined}
      fallback={context.renderDefaultListbox({
        ...rest,
        itemRender: local.itemRender,
        emptyRender: local.emptyRender,
        ref: local.ref,
        class: local.class,
        style: local.style,
      })}
    >
      <div
        id={context.listboxId()}
        role="listbox"
        aria-multiselectable={context.multiple() || undefined}
        tabIndex={-1}
        data-slot="listbox"
        {...rest}
        ref={(element: HTMLDivElement) => {
          context.setListboxRef(element)
          callRef(local.ref, element)
        }}
        class={cn(listboxResolved().class, local.class)}
        style={{
          ...toStyleObject(listboxResolved().style),
          ...toStyleObject(local.style),
        }}
        onScroll={(event: Event) => {
          context.handleListboxScroll(event)
          callHandler(event, (rest as any).onScroll)
        }}
      >
        {local.children}
      </div>
    </Show>
  )
}
