import { Progress } from '@src'
import type { ProgressT } from '@src'

export interface ProgressPlaygroundProps {
  value?: number
  size?: ProgressT.Variant['size']
  status?: boolean
  animation?: 'carousel' | 'reverse' | 'swing' | 'elastic'
}

export function ProgressPlayground(props: ProgressPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <Progress
        value={props.value ?? 65}
        size={props.size ?? 'md'}
        status={props.status ?? true}
        animation={props.animation ?? 'carousel'}
      />
    </div>
  )
}
