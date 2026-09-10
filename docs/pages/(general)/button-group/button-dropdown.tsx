import { Button, ButtonGroup, DropdownMenu, Icon } from '@src'
import type { DropdownMenuT } from '@src'
import { createSignal } from 'solid-js'

export function DropdownAction() {
  const [exportedFormat, setExportedFormat] = createSignal<string>()

  const exportItems: DropdownMenuT.Item[] = [
    {
      type: 'group',
      label: 'Export report',
      children: [
        {
          label: 'PDF document',
          description: 'Best for sharing and printing',
          icon: 'i-lucide:file-text',
          onSelect: () => setExportedFormat('PDF'),
        },
        {
          label: 'CSV spreadsheet',
          description: 'Best for analysis and imports',
          icon: 'i-lucide:table-2',
          onSelect: () => setExportedFormat('CSV'),
        },
        {
          label: 'JSON data',
          description: 'Best for integrations',
          icon: 'i-lucide:braces',
          onSelect: () => setExportedFormat('JSON'),
        },
      ],
    },
  ]

  return (
    <div class="flex flex-col gap-3 items-start">
      <ButtonGroup>
        <Button leading="i-lucide:download">Export report</Button>
        <DropdownMenu>
          <DropdownMenu.Trigger as={Button} size="icon-md">
            <Icon name="i-lucide:chevron-down" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content items={exportItems} />
        </DropdownMenu>
      </ButtonGroup>

      <p class="text-sm text-muted-foreground min-h-5" role="status" aria-live="polite">
        {exportedFormat() ? `Report exported as ${exportedFormat()}.` : 'Choose an export format.'}
      </p>
    </div>
  )
}
