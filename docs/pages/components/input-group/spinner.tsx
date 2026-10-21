import { Icon, Input, InputGroup } from '@src'

export function LoadingIndicators() {
  return (
    <div class="gap-4 grid max-w-sm w-full">
      <InputGroup>
        <Input aria-label="Searching" placeholder="Searching..." />
        <InputGroup.Trailing>
          <Icon name="icon-loading" class="animate-spin" />
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="icon-loading" class="animate-spin" />
        </InputGroup.Leading>
        <Input aria-label="Processing" placeholder="Processing..." />
      </InputGroup>
      <InputGroup>
        <Input aria-label="Saving changes" placeholder="Saving changes..." />
        <InputGroup.Trailing>
          <span>Saving...</span>
          <Icon name="icon-loading" class="animate-spin" />
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <InputGroup.Leading>
          <Icon name="i-lucide:loader-circle" class="animate-spin" />
        </InputGroup.Leading>
        <Input aria-label="Refreshing data" placeholder="Refreshing data..." />
        <InputGroup.Trailing>Please wait...</InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
