import type { JSX } from 'solid-js'

import { Button } from '../../../element/button'
import type { ButtonT } from '../../../element/button'
import type { SlotClassValue, SlotStyleValue } from '../../../theme/style-types'

import type { FeedbackAction } from './feedback.types'

export function FeedbackActionButton(props: {
  action?: FeedbackAction
  label?: JSX.Element
  variant: NonNullable<ButtonT.Variant['variant']>
  size?: ButtonT.Variant['size']
  loading?: boolean
  disabled?: boolean
  slotName?: string
  class?: SlotClassValue
  style?: SlotStyleValue
  'aria-label'?: string
  onClick: (event: MouseEvent) => void | Promise<unknown>
}): JSX.Element {
  const label = () => props.action?.label ?? props.label
  return (
    <Button
      data-slot={props.slotName}
      slotName={props.slotName}
      size={props.size}
      variant={props.action?.variant ?? props.variant}
      leading={props.action?.leading}
      disabled={props.disabled || Boolean(props.action?.disabled)}
      loading={props.loading}
      class={props.class}
      style={props.style}
      aria-label={props['aria-label']}
      onClick={(event) => {
        const result = props.onClick(event)
        if (result && typeof result.then === 'function') {
          return Promise.resolve(result).then(
            () => undefined,
            () => undefined,
          )
        }
        return result
      }}
    >
      {label()}
    </Button>
  )
}
