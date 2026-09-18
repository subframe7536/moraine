import { Button, DropdownMenu, Icon, Input, InputGroup } from '@src'

export function DropdownActions() {
  return (
    <div class="gap-4 grid max-w-sm w-full">
      <InputGroup>
        <Input aria-label="File name" placeholder="Enter file name" />
        <InputGroup.Trailing compact>
          <DropdownMenu placement="bottom-end">
            <DropdownMenu.Trigger as={Button} type="button" variant="ghost" size="icon-xs">
              <Icon name="i-lucide:ellipsis" />
              <span class="sr-only">More file actions</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              items={[
                { label: 'Settings', icon: 'i-lucide:settings' },
                { label: 'Copy path', icon: 'i-lucide:copy' },
                { label: 'Open location', icon: 'i-lucide:folder-open' },
              ]}
            />
          </DropdownMenu>
        </InputGroup.Trailing>
      </InputGroup>
      <InputGroup>
        <Input aria-label="Search query" placeholder="Enter search query" />
        <InputGroup.Trailing compact>
          <DropdownMenu placement="bottom-end">
            <DropdownMenu.Trigger
              as={Button}
              type="button"
              variant="ghost"
              size="xs"
              trailing="i-lucide:chevron-down"
            >
              Search in
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              items={[{ label: 'Documentation' }, { label: 'Blog posts' }, { label: 'Changelog' }]}
            />
          </DropdownMenu>
        </InputGroup.Trailing>
      </InputGroup>
    </div>
  )
}
