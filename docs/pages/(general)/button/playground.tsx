import { Button } from '@src/elements/button/button.tsx'
import type { ButtonT } from '@src/elements/button/button.tsx'

export interface ButtonPlaygroundProps {
  label?: string
  variant?: ButtonT.Variant['variant']
  size?: ButtonT.Variant['size']
  disabled?: boolean
  loading?: boolean
}

export function ButtonPlayground(props: ButtonPlaygroundProps) {
  return (
    <Button
      variant={props.variant ?? 'default'}
      size={props.size ?? 'md'}
      disabled={props.disabled ?? false}
      loading={props.loading ?? false}
    >
      {props.label ?? 'Button'}
    </Button>
  )
}
