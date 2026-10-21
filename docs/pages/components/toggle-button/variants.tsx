import { ToggleButton } from '@src'

export function Variants() {
  return (
    <div class="flex flex-wrap gap-3">
      <ToggleButton>Ghost to soft</ToggleButton>
      <ToggleButton variant="outline" activeVariant="solid">
        Outline to solid
      </ToggleButton>
      <ToggleButton
        variant="soft"
        tone="neutral"
        activeVariant="solid"
        activeTone="danger"
        defaultPressed
      >
        Soft to danger
      </ToggleButton>
    </div>
  )
}
