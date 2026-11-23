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
          icon: 'i-lucide:file-text',
          onSelect: () => setExportedFormat('PDF'),
        },
        {
          label: 'CSV spreadsheet',
          icon: 'i-lucide:table-2',
          onSelect: () => setExportedFormat('CSV'),
        },
        {
          label: 'JSON data',
          icon: 'i-lucide:braces',
          onSelect: () => setExportedFormat('JSON'),
        },
      ],
    },
  ]

  return (
    <div class="flex flex-col gap-3 items-start">
      <ButtonGroup aria-label="Export actions">
        <Button leading="i-lucide:download">Export report</Button>
        <ButtonGroup.Separator />
        <DropdownMenu placement="bottom" align="end">
          <DropdownMenu.Trigger as={Button} size="icon-md" aria-label="Choose export format">
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
