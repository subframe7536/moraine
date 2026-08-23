import { Icon } from '@src'

export interface IconPlaygroundProps {
  name?: string
  size?: number
}

export function IconPlayground(props: IconPlaygroundProps) {
  return (
    <div class="p-4 flex items-center justify-center">
      <Icon
        name={props.name ?? 'i-lucide:sparkles'}
        size={props.size ?? 28}
        class="text-primary transition-all"
      />
    </div>
  )
}
