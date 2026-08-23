import { Input } from '@src'

export interface InputPlaygroundProps {
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}

export function InputPlayground(props: InputPlaygroundProps) {
  return (
    <div class="w-80">
      <Input
        placeholder={props.placeholder ?? 'Search projects'}
        disabled={props.disabled ?? false}
        loading={props.loading ?? false}
      />
    </div>
  )
}
