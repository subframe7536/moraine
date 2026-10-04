import { Accordion, AvatarGroup, ButtonGroup, Resizable } from 'moraine'
import type { AccordionT } from 'moraine'

;<Accordion
  items={[{ value: 'billing plan / 中文?', label: 'Billing' }]}
  value={[]}
  onChange={(value: string[]) => void value}
/>
;<Accordion
  multiple
  items={[{ value: 'a' }]}
  value={['a']}
  onChange={(value: string[]) => void value}
/>
;<Accordion
  items={[{ value: 'a' }]}
  onChange={(value) => {
    const single: string[] = value
    void single
  }}
/>
;<Accordion
  multiple
  items={[{ value: 'a' }]}
  onChange={(value) => {
    const many: string[] = value
    void many
  }}
/>
;<Accordion items={[{ value: 'a' }]} value={['a']} />
;<Accordion multiple collapsible items={[{ value: 'a' }]} />
const missingValue: AccordionT.Item = { label: 'Missing' }
void missingValue

;<Resizable value={[300, '70%']} onChange={(sizes: number[]) => void sizes}>
  <Resizable.Panel collapsible onCollapse={(size: number) => void size} />
  <Resizable.Handle intersection />
  <Resizable.Panel />
</Resizable>

;<AvatarGroup max={0} />
// @ts-expect-error max accepts numbers only.
;<AvatarGroup max="2" />
;<ButtonGroup size="sm" orientation="vertical">
  <ButtonGroup.Separator />
</ButtonGroup>
// @ts-expect-error ButtonGroup supports ComponentSize, not icon sizes.
;<ButtonGroup size="icon-sm" />
