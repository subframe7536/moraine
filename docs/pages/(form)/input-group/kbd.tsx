import { Icon, Input, InputGroup, Kbd } from '@src'

export function KeyboardShortcut() {
  return (
    <InputGroup class="max-w-sm">
      <InputGroup.Leading>
        <Icon name="i-lucide:search" />
      </InputGroup.Leading>
      <Input aria-label="Search" placeholder="Search..." />
      <InputGroup.Trailing compact>
        <Kbd value="command" size="sm" />
        <Kbd value="K" size="sm" />
      </InputGroup.Trailing>
    </InputGroup>
  )
}
