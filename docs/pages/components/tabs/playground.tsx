import { Tabs } from '@src'
import type { TabsT } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const ITEMS: TabsT.Item[] = [
  {
    label: 'Overview',
    value: 'overview',
    icon: 'i-lucide:layout-dashboard',
    get content() {
      return (
        <p class="text-xs text-muted-foreground leading-relaxed pt-3">
          High-level metrics and system activity overview.
        </p>
      )
    },
  },
  {
    label: 'Deployments',
    value: 'deployments',
    icon: 'i-lucide:rocket',
    get content() {
      return (
        <p class="text-xs text-muted-foreground leading-relaxed pt-3">
          Production pipelines, recent builds, and rollout health.
        </p>
      )
    },
  },
  {
    label: 'Settings',
    value: 'settings',
    icon: 'i-lucide:settings',
    get content() {
      return (
        <p class="text-xs text-muted-foreground leading-relaxed pt-3">
          Environment variables, security secrets, and domain management.
        </p>
      )
    },
  },
]

export default function TabsPlayground() {
  return (
    <DocsPlayground
      controls={[
        {
          kind: 'select',
          prop: 'variant',
          label: 'Variant',
          defaultValue: 'pill',
          options: [
            { label: 'Pill', value: 'pill' },
            { label: 'Link', value: 'link' },
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
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
      ]}
    >
      {(props) => (
        <div class="max-w-lg w-full">
          <Tabs
            aria-label="Project sections"
            defaultValue="overview"
            variant={props.variant}
            size={props.size}
            disabled={props.disabled}
            items={ITEMS}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
