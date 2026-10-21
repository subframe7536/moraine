import { Button, Toast } from '@src'

export function ArchiveItem() {
  const handleArchive = () => {
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

  return (
    <Button variant="outline" leading="i-lucide:archive" onClick={handleArchive}>
      Archive conversation
    </Button>
  )
}
