import { Kbd } from '@src'
import type { KbdT } from '@src'

export interface KbdPlaygroundProps {
  value?: string
  variant?: KbdT.Variant['variant']
  size?: KbdT.Variant['size']
  symbol?: boolean
}

export function KbdPlayground(props: KbdPlaygroundProps) {
  return (
    <div class="flex gap-2 items-center">
      <span class="text-xs text-muted-foreground">Press</span>
      <Kbd
        value={props.value ?? 'meta'}
        variant={props.variant ?? 'default'}
        size={props.size ?? 'md'}
        symbol={props.symbol ?? true}
      />
      <Kbd value="K" variant={props.variant ?? 'default'} size={props.size ?? 'md'} />
      <span class="text-xs text-muted-foreground">to open command menu</span>
    </div>
  )
}
