import { Separator } from '@src'

export function WithContentVertical() {
  return (
    <div class="space-y-6">
      <Separator>
        <span class="text-xs text-muted-foreground">OR</span>
      </Separator>

      <div class="flex gap-4 h-20 items-center">
        <span>Left</span>
        <Separator orientation="vertical" />
        <span>Center</span>
        <Separator orientation="vertical" type="dashed" classes={{ root: 'text-primary' }} />
        <span>Right</span>
      </div>
    </div>
  )
}
