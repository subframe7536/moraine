import type { JSX } from 'solid-js'
import { Show, splitProps } from 'solid-js'

import { callHandler } from '../../../shared/utils'
import { CHECKBOX_ICON_CLASS } from '../../checkbox/checkbox.recipe'
import { Icon } from '../../icon'
import type { IconT } from '../../icon'

import { checkControlDataAttributes } from './check-control.recipe'

export interface CheckControlProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'role' | 'children' | 'disabled' | 'style' | 'aria-checked'
> {
  /** Check state; `'indeterminate'` renders the mixed state. */
  checked: boolean | 'indeterminate'
  /** Whether the control ignores clicks. */
  disabled?: boolean
  /** `data-slot` of the host; the icon uses `${slotName}-icon`. */
  slotName: string
  /** @default 'icon-check' */
  checkedIcon?: IconT.Name
  /** @default 'icon-minus' */
  indeterminateIcon?: IconT.Name
  style?: JSX.CSSProperties
  /** Called with the next value. An unchecked or indeterminate control becomes checked. */
  onCheckedChange: (checked: boolean) => void
}

/**
 * Lightweight checkbox for rows of composite components: a `role="checkbox"` button without
 * form integration or labels. Owners that announce the check state themselves (such as a
 * `treeitem` with `aria-checked`) hide it with `aria-hidden` and `tabIndex={-1}`.
 */
export function CheckControl(props: CheckControlProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'checked',
    'disabled',
    'slotName',
    'checkedIcon',
    'indeterminateIcon',
    'class',
    'style',
    'onCheckedChange',
    'onClick',
    'onKeyDown',
  ])
  const checked = () => local.checked === true
  const indeterminate = () => local.checked === 'indeterminate'
  const unchecked = () => local.checked === false
  const disabled = () => Boolean(local.disabled)

  return (
    <button
      type="button"
      role="checkbox"
      data-slot={local.slotName}
      {...checkControlDataAttributes({ checked, unchecked, indeterminate, disabled })}
      {...rest}
      class={local.class}
      style={local.style}
      disabled={disabled()}
      aria-checked={indeterminate() ? 'mixed' : checked()}
      onClick={(event) => {
        if (callHandler(event, local.onClick).defaultPrevented || disabled()) {
          return
        }
        local.onCheckedChange(!checked())
      }}
      onKeyDown={(event) => {
        // Checkboxes toggle with Space only; Enter would otherwise activate the button.
        if (!callHandler(event, local.onKeyDown).defaultPrevented && event.key === 'Enter') {
          event.preventDefault()
        }
      }}
    >
      <Show when={!unchecked()}>
        <Icon
          name={
            indeterminate()
              ? (local.indeterminateIcon ?? 'icon-minus')
              : (local.checkedIcon ?? 'icon-check')
          }
          data-slot={`${local.slotName}-icon`}
          class={CHECKBOX_ICON_CLASS}
        />
      </Show>
    </button>
  )
}
