import { Badge, Button, Card } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function CardPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'title', label: 'Title', defaultValue: 'Team Subscription' },
        {
          kind: 'input',
          prop: 'description',
          label: 'Description',
          defaultValue: 'Manage billing and team seat limits.',
        },
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'outline',
          options: [
            { label: 'Outline', value: 'outline' },
            { label: 'Subtle', value: 'subtle' },
            { label: 'None', value: 'none' },
          ],
        },
        {
          kind: 'select',
          prop: 'size',
          label: 'Size',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
      ]}
    >
      {(props) => (
        <div class="max-w-full w-96">
          <Card variant={props.variant} size={props.size}>
            <Card.Header>
              <Card.Title>{props.title}</Card.Title>
              <Card.Description>{props.description}</Card.Description>
              <Card.Action>
                <Badge variant="outline">Pro Plan</Badge>
              </Card.Action>
            </Card.Header>
            <Card.Body>
              <p class="leading-relaxed">
                Your team has 8 active seats out of 10 available. Upgrade to Enterprise for
                unlimited seats and SSO integration.
              </p>
            </Card.Body>
            <Card.Footer>
              <div class="flex w-full items-center justify-between">
                <span class="text-xs text-muted-foreground">$49 / month</span>
                <Button size="sm">Manage billing</Button>
              </div>
            </Card.Footer>
          </Card>
        </div>
      )}
    </DocsPlayground>
  )
}
