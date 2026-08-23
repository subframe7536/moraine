import { KbdGroup } from '@src'
import type { KbdGroupT } from '@src'

export interface KbdGroupPlaygroundProps {
  size?: KbdGroupT.Variant['size']
  separator?: boolean
}

export function KbdGroupPlayground(props: KbdGroupPlaygroundProps) {
  return (
    <div class="flex gap-2 items-center">
      <span class="text-xs text-muted-foreground">Quick save:</span>
      <KbdGroup
        items={['ctrl', 'shift', 'S']}
        size={props.size ?? 'md'}
        separator={props.separator ?? true}
      />
    </div>
  )
}
