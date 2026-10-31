import { Accordion } from '@src'

import { DocsPlayground } from '../../../routes/components/markdown/playground'

const FAQ_ITEMS = [
  {
    value: 'install',
    label: 'How do I install Moraine?',
    leading: 'i-lucide:download',
    content:
      'Install moraine and configure either UnoCSS or Tailwind CSS before rendering components.',
  },
  {
    value: 'ssr',
    label: 'Is server-side rendering supported?',
    leading: 'i-lucide:server',
    content:
      'Moraine components render on the server and hydrate on the client in a Solid application.',
  },
  {
    value: 'customize',
    label: 'Can I customize component styles?',
    leading: 'i-lucide:palette',
    content: 'Components expose root class and style props plus named slot classes and styles.',
  },
]

export default function AccordionPlayground() {
  return (
    <DocsPlayground
      controls={[
        { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
        { kind: 'switch', prop: 'collapsible', label: 'Collapsible', defaultValue: true },
      ]}
    >
      {(props) => (
        <div class="max-w-full w-96">
          <Accordion
            items={FAQ_ITEMS}
            defaultValue={['install']}
            disabled={props.disabled}
            collapsible={props.collapsible}
          />
        </div>
      )}
    </DocsPlayground>
  )
}
