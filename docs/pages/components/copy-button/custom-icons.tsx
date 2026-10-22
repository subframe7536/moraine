import { CopyButton, Input } from '@src'

export function CustomIcons() {
  const token = 'ghp_exampleTokenValue1234567890'

  return (
    <div class="flex gap-2 max-w-sm w-full items-center">
      <Input value={token} readOnly type="password" class="text-xs font-mono" />
      <CopyButton
        value={token}
        icon="i-lucide:clipboard"
        copiedIcon="i-lucide:check-check"
        copiedDuration={3000}
        aria-label="Copy personal access token"
      />
    </div>
  )
}
