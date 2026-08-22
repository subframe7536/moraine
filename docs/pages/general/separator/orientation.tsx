import { Separator } from '@src'

export function Orientation() {
  return (
    <div class="flex gap-4 h-20 items-center">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Center</span>
      <Separator orientation="vertical" type="dashed" class="text-primary" />
      <span>Right</span>
    </div>
  )
}
