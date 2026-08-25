import { Button, DropdownMenu } from '@src'

export function Submenus() {
  return (
    <DropdownMenu
      items={[
        {
          label: 'Move to…',
          icon: 'i-lucide:folder-input',
          children: [
            {
              type: 'group',
              label: 'Folders',
              children: [
                { label: 'Inbox', icon: 'i-lucide:inbox' },
                { label: 'Archive', icon: 'i-lucide:archive' },
              ],
            },
          ],
        },
        { label: 'Download', icon: 'i-lucide:download' },
      ]}
    >
      {(triggerProps) => (
        <Button {...triggerProps} variant="outline">
          File
        </Button>
      )}
    </DropdownMenu>
  )
}
