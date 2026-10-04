import { ToggleButton } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-3">
      <ToggleButton>Ghost to secondary</ToggleButton>
      <ToggleButton variant="outline" activeVariant="default">
        Outline to primary
      </ToggleButton>
      <ToggleButton variant="secondary" activeVariant="destructive" defaultPressed>
        Secondary to destructive
      </ToggleButton>
    </div>
  )
}
