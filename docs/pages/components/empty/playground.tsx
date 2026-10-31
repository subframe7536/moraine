import { Button, Empty, Icon } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function EmptyPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'input', prop: 'title', label: 'Title', defaultValue: 'No projects yet' },
        {
          kind: 'input',
          prop: 'description',
          label: 'Description',
          defaultValue: 'Create a project to organize your work.',
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
        <Empty size={props.size}>
          <Empty.Media>
            <span class="text-3xl text-muted-foreground">
              <Icon name="i-lucide-folder-open" />
            </span>
          </Empty.Media>
          <Empty.Title>{props.title}</Empty.Title>
          <Empty.Description>{props.description}</Empty.Description>
          <Empty.Actions>
            <Button>Create project</Button>
            <Button as="a" href="#usage" variant="outline">
              Learn more
            </Button>
          </Empty.Actions>
        </Empty>
      )}
    </DocsPlayground>
  )
}
