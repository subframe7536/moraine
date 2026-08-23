import { Badge, Button, Card } from '@src'

export interface CardPlaygroundProps {
  title?: string
  description?: string
  compact?: boolean
}

export function CardPlayground(props: CardPlaygroundProps) {
  return (
    <Card
      title={props.title ?? 'Team Subscription'}
      description={props.description ?? 'Manage billing and team seat limits.'}
      action={<Badge variant="outline">Pro Plan</Badge>}
      compact={props.compact ?? false}
      footer={
        <div class="flex w-full items-center justify-between">
          <span class="text-xs text-muted-foreground">$49 / month</span>
          <Button size="sm">Manage billing</Button>
        </div>
      }
      class="max-w-full w-96"
    >
      <p class="text-xs text-muted-foreground leading-relaxed">
        Your team has 8 active seats out of 10 available. Upgrade to Enterprise for unlimited seats
        and SSO integration.
      </p>
    </Card>
  )
}
