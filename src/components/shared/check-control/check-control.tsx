import type { JSX } from '@solidjs/web'
import { Show, omit } from 'solid-js'

import { createKeyDownHandler } from '../../../shared/keyboard'
import { callHandler } from '../../../shared/utils'
import { CHECKBOX_ICON_CLASS } from '../../checkbox/checkbox.recipe'
import { Icon } from '../../icon'
import type { IconT } from '../../icon'
import { submitFormDefault } from '../form/submit-form-default'

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
 * `treeitem` with `aria-checked`) hide it with `aria-hidden` and `tabindex={-1}`.
 */
export function CheckControl(props: CheckControlProps): JSX.Element {
  const rest = omit(
    props,
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
  )
  // Checkboxes toggle with Space only; Enter implicitly submits the form instead of
  // activating the button, matching a native checkbox.
  const onKeyDown = createKeyDownHandler<HTMLButtonElement>({
    onKeyDown: () => props.onKeyDown,
    keys: { Enter: (event) => submitFormDefault(event.currentTarget) },
  })
  const checked = () => props.checked === true
  const indeterminate = () => props.checked === 'indeterminate'
  const unchecked = () => props.checked === false
  const disabled = () => Boolean(props.disabled)

  return (
    <button
      type="button"
      role="checkbox"
      data-slot={props.slotName}
      // oxlint-disable-next-line moraine/data-attributes-in-slot-binding -- Private host without a recipe; callers pass class and style.
      {...checkControlDataAttributes({ checked, unchecked, indeterminate, disabled })}
      {...rest}
      class={props.class}
      style={props.style}
      disabled={disabled()}
      aria-checked={indeterminate() ? 'mixed' : checked() ? 'true' : 'false'}
      onClick={(event) => {
        if (callHandler(event, props.onClick).defaultPrevented || disabled()) {
          return
        }
        props.onCheckedChange(!checked())
      }}
      onKeyDown={onKeyDown}
    >
      <Show when={!unchecked()}>
        <Icon
          name={
            indeterminate()
              ? (props.indeterminateIcon ?? 'icon-minus')
              : (props.checkedIcon ?? 'icon-check')
          }
          data-slot={`${props.slotName}-icon`}
          class={CHECKBOX_ICON_CLASS}
        />
      </Show>
    </button>
  )
}
