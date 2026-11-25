import { Button, Toast } from '@src'
function handleArchive() {
  Toast.show({
    title: 'Conversation archived',
    description: 'Moved to your archive folder.',
    action: {
      label: 'Undo',
      onClick: () => {
        Toast.success({ title: 'Conversation restored' })
      },
    },
  })
}

export function ArchiveItem() {
  return (
    <Button variant="outline" leading="i-lucide:archive" onClick={handleArchive}>
      Archive conversation
    </Button>
  )
}
