import { Textarea } from '@src'
import type { TextareaT } from '@src'

export interface TextareaPlaygroundProps {
  placeholder?: string
  variant?: TextareaT.Variant['variant']
  size?: TextareaT.Variant['size']
  disabled?: boolean
  autoResize?: boolean
}

export function TextareaPlayground(props: TextareaPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <Textarea
        placeholder={props.placeholder ?? 'Write a comment or description...'}
        variant={props.variant ?? 'outline'}
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        autoResize={props.autoResize ?? true}
        rows={3}
      />
    </div>
  )
}
