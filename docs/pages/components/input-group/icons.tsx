import { Icon, Input, InputGroup } from '@src'

export function Icons() {
  return (
    <div class="gap-4 grid max-w-sm w-full">
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:search" />
        </InputGroup.Leading>
        <Input aria-label="Search" placeholder="Search..." />
      </InputGroup>
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:mail" />
        </InputGroup.Leading>
        <Input type="email" aria-label="Email" placeholder="Enter your email" />
      </InputGroup>
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:credit-card" />
        </InputGroup.Leading>
        <Input aria-label="Card number" placeholder="Card number" />
        <InputGroup.Trailing>
          <Icon name="i-lucide:check" />
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <Input aria-label="Favorite card" placeholder="Card number" />
        <InputGroup.Trailing>
          <Icon name="i-lucide:star" />
          <Icon name="i-lucide:info" />
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
