import { Alert, Button } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function AlertPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'type',
          label: 'Type',
          defaultValue: 'info',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Info', value: 'info' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Error', value: 'error' },
          ],
        },
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'subtle',
          options: [
            { label: 'Subtle', value: 'subtle' },
            { label: 'Soft', value: 'soft' },
            { label: 'Outline', value: 'outline' },
            { label: 'Solid', value: 'solid' },
          ],
        },
        { kind: 'switch', prop: 'actions', label: 'Actions', defaultValue: true },
        { kind: 'switch', prop: 'closable', label: 'Close Button', defaultValue: true },
        {
          kind: 'select',
          prop: 'closeIcon',
          label: 'Close Icon',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Circle (icon-x-circle)', value: 'icon-x-circle' },
          ],
        },
        { kind: 'switch', prop: 'fullWidth', label: 'Full Width', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-xl w-full">
          <Alert
            type={props.type}
            variant={props.variant}
            actions={
              props.actions ? (
                <>
                  <Button size="sm" variant="outline">
                    Details
                  </Button>
                  <Button size="sm">Action</Button>
                </>
              ) : undefined
            }
            closable={props.closable}
            closeIcon={props.closeIcon === 'default' ? undefined : props.closeIcon}
            fullWidth={props.fullWidth}
            title="Alert notification"
            description="Detailed contextual message providing helpful instructions."
          />
        </div>
      )}
    </DocsPlayground>
  )
}
