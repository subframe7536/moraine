import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

const VISUALLY_HIDDEN_INPUT_STYLE: JSX.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  'white-space': 'nowrap',
  border: 0,
}

export interface HiddenInputProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  style?: JSX.CSSProperties
  visuallyHidden?: boolean
}

export function HiddenInput(props: HiddenInputProps): JSX.Element {
  const rest = omit(props, 'style', 'visuallyHidden')

  return (
    <input
      {...rest}
      style={
        props.visuallyHidden === false
          ? props.style
          : {
              ...VISUALLY_HIDDEN_INPUT_STYLE,
              ...props.style,
            }
      }
    />
  )
}
