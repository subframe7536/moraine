import { Accordion, AvatarGroup, ButtonGroup, Resizable } from 'moraine'
import type { AccordionT } from 'moraine'

;<Accordion
  items={[{ value: 'billing plan / 中文?', label: 'Billing' }]}
  value={[]}
  onValueChange={(value: string[]) => void value}
/>
;<Accordion
  multiple
  items={[{ value: 'a' }]}
  value={['a']}
  onValueChange={(value: string[]) => void value}
/>
;<Accordion
  items={[{ value: 'a' }]}
  onValueChange={(value) => {
    const single: string[] = value
    void single
  }}
/>
;<Accordion
  multiple
  items={[{ value: 'a' }]}
  onValueChange={(value) => {
    const many: string[] = value
    void many
  }}
/>
;<Accordion items={[{ value: 'a' }]} value={['a']} />
;<Accordion multiple collapsible items={[{ value: 'a' }]} />
// @ts-expect-error Accordion items require a value.
const missingValue: AccordionT.Item = { label: 'Missing' }
void missingValue

;<Resizable
  value={{ a: 30, b: 70 }}
  onValueChange={(layout: Record<string, number>) => void layout}
>
  <Resizable.Panel id="a" collapsible onCollapse={() => {}} />
  <Resizable.Handle intersection />
  <Resizable.Panel id="b" />
</Resizable>

;<AvatarGroup max={0} />
// @ts-expect-error max accepts numbers only.
;<AvatarGroup max="2" />
;<ButtonGroup size="sm" orientation="vertical">
  <ButtonGroup.Separator />
</ButtonGroup>
// @ts-expect-error ButtonGroup supports ComponentSize, not icon sizes.
;<ButtonGroup size="icon-sm" />
