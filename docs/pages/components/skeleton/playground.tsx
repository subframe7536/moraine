import { Skeleton } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

export default function SkeletonPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Animation',
          defaultValue: 'pulse',
          options: [
            { label: 'Pulse', value: 'pulse' },
            { label: 'Shimmer', value: 'shimmer' },
          ],
        },
        {
          kind: 'select',
          prop: 'shape',
          label: 'Shape',
          defaultValue: 'rounded-md',
          options: [
            { label: 'Rounded', value: 'rounded-md' },
            { label: 'Circle', value: 'rounded-full' },
            { label: 'Square', value: 'rounded-none' },
          ],
        },
      ]}
    >
      {(props) => <Skeleton variant={props.variant} class={`size-20 ${props.shape}`} />}
    </DocsPlayground>
  )
}
