import { Button, Empty, Icon } from '@src'

export function Actions() {
  return (
    <Empty>
      <Empty.Media>
        <Icon name="i-lucide-inbox" class="text-muted-foreground size-8" />
      </Empty.Media>
      <Empty.Title>Your inbox is empty</Empty.Title>
      <Empty.Description>Start a conversation with your team.</Empty.Description>
      <Empty.Actions>
        <Button>New message</Button>
        <Button as="a" href="#basic-usage" variant="outline">
          Learn more
        </Button>
      </Empty.Actions>
    </Empty>
  )
}
