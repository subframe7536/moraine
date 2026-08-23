import { Badge } from '@src'
import type { BadgeT } from '@src'

export interface BadgePlaygroundProps {
  title?: string
  variant?: BadgeT.Variant['variant']
  size?: BadgeT.Variant['size']
}

export function BadgePlayground(props: BadgePlaygroundProps) {
  return (
    <Badge
      variant={props.variant ?? 'default'}
      size={props.size ?? 'md'}
      leading="i-lucide:sparkles"
    >
      {props.title ?? 'New feature'}
    </Badge>
  )
}
