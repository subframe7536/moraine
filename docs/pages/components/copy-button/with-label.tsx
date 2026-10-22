import { CopyButton } from '@src'

export function WithLabel() {
  const curlCommand = 'curl -s https://moraine.subf.dev/install.sh | bash'

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <CopyButton value={curlCommand} variant="soft" size="sm">
        {(state) => (state.isCopied ? 'Copied to clipboard!' : 'Copy curl command')}
      </CopyButton>

      <CopyButton value={curlCommand} variant="outline" size="sm" iconPosition="trailing">
        Copy snippet
      </CopyButton>
    </div>
  )
}
