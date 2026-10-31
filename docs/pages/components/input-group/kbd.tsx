import { Icon, Input, InputGroup, KbdGroup } from '@src'

export function KeyboardShortcut() {
  return (
    <div class="max-w-sm">
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:search" />
        </InputGroup.Leading>
        <Input aria-label="Search" placeholder="Search..." />
        <InputGroup.Trailing compact>
          <KbdGroup items={['command', 'K']} />
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
