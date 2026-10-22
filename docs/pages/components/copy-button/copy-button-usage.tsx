import { CopyButton, Input } from '@src'

export function CopyButtonUsage() {
  const code = 'pnpm add moraine'

  return (
    <div class="flex gap-2 max-w-sm w-full items-center">
      <Input value={code} readOnly class="text-xs font-mono" />
      <CopyButton value={code} />
    </div>
  )
}
