import { AvatarGroup, Button, Empty } from '@src'

export function RichMedia() {
  return (
    <Empty>
      <Empty.Media>
        <AvatarGroup
          items={[
            { text: 'Alex', alt: 'Alex' },
            { text: 'Sam', alt: 'Sam' },
            { text: 'Jo', alt: 'Jo' },
          ]}
          size="lg"
        />
      </Empty.Media>
      <Empty.Title>No team members yet</Empty.Title>
      <Empty.Description>Invite your collaborators to work together.</Empty.Description>
      <Empty.Actions>
        <Button>Invite members</Button>
      </Empty.Actions>
    </Empty>
  )
}
