import { Input } from '@src'
import type { InputT } from '@src'

export interface InputPlaygroundProps {
  placeholder?: string
  variant?: InputT.Variant['variant']
  size?: InputT.Variant['size']
  disabled?: boolean
  loading?: boolean
}

export function InputPlayground(props: InputPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <Input
        placeholder={props.placeholder ?? 'Search projects...'}
        variant={props.variant ?? 'outline'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        loading={props.loading ?? false}
        leading="i-lucide:search"
      />
    </div>
  )
}
