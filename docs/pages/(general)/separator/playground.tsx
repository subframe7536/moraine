import { Separator } from '@src'
import type { SeparatorT } from '@src'

export interface SeparatorPlaygroundProps {
  size?: SeparatorT.Variant['size']
  type?: SeparatorT.Variant['type']
}

export function SeparatorPlayground(props: SeparatorPlaygroundProps) {
  return (
    <div class="max-w-full w-80 space-y-4">
      <div class="text-xs text-muted-foreground">Section Header</div>
      <Separator size={props.size ?? 'sm'} type={props.type ?? 'solid'} />
      <div class="text-xs text-muted-foreground">Content Section</div>
    </div>
  )
}
