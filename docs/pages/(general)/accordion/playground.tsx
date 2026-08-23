import { Accordion } from '@src'
import type { AccordionT } from '@src'

const FAQ_ITEMS: AccordionT.Item[] = [
  {
    value: 'install',
    label: 'How do I install Moraine?',
    content:
      'Install moraine with bun add moraine and configure UnoCSS or Tailwind with presetMoraine.',
  },
  {
    value: 'ssr',
    label: 'Is server-side rendering supported?',
    content:
      'Yes, Moraine components render safely during Solid SSR and hydrate seamlessly on the client.',
  },
  {
    value: 'customize',
    label: 'Can I customize component styles?',
    content:
      'Every component provides root class/style props and named slots classes/styles for fine-grained customization.',
  },
]

export interface AccordionPlaygroundProps {
  disabled?: boolean
  collapsible?: boolean
}

export function AccordionPlayground(props: AccordionPlaygroundProps) {
  return (
    <div class="max-w-full w-96">
      <Accordion
        items={FAQ_ITEMS}
        defaultValue={['install']}
        disabled={props.disabled ?? false}
        collapsible={props.collapsible ?? true}
      />
    </div>
  )
}
