import type { JSX } from 'solid-js'
import { Show, onCleanup, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { useCn } from '../../shared/provider'

import { useBaseSelectContext } from './base-select-context'
import { BaseSelectListbox } from './base-select-listbox'
import type { BaseSelectT } from './base-select.types'
import { toStyleObject } from './shared'

export function BaseSelectContent(props: BaseSelectT.ContentProps): JSX.Element {
  const context = useBaseSelectContext()
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'children',
    'positionerClass',
    'positionerStyle',
    'class',
    'style',
  ])

  const unregister = context.registerContent()
  onCleanup(unregister)

  return (
    <Show when={context.contentPresence.present()}>
      {(_present) => (
        <Portal>
          <div
            ref={(element) => {
              context.setPositionerElement(element)
              if (element) {
                element.style.position = 'absolute'
                element.style.visibility = 'hidden'
              }
              onCleanup(() => {
                context.setPositionerElement(undefined)
              })
            }}
            data-slot="positioner"
            class={cn('left-0 top-0 absolute', local.positionerClass)}
            style={{ visibility: 'hidden', ...toStyleObject(local.positionerStyle) }}
          >
            <div
              {...context.contentPresence.dataAttrs()}
              ref={(element) => {
                context.setContentElement(element)
                context.contentPresence.setElement(element)
                onCleanup(() => {
                  context.setContentElement(undefined)
                  context.contentPresence.setElement(undefined)
                })
              }}
              data-slot="content"
              data-side={context.contentSide()}
              {...rest}
              class={cn(context.resolved.slot('content').class, local.class)}
              style={{
                '--mo-popper-content-transform-origin': undefined,
                ...context.resolved.slot('content').style,
                ...toStyleObject(local.style),
              }}
            >
              {local.children ?? <BaseSelectListbox />}
            </div>
          </div>
        </Portal>
      )}
    </Show>
  )
}
