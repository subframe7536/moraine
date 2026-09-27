import { Accordion, AvatarGroup, ButtonGroup, Resizable } from 'moraine'
import type { AccordionT, AvatarT } from 'moraine'

;<Accordion
  items={[{ value: 'billing plan / 中文?', label: 'Billing' }]}
  value={null}
  onChange={(value: string | null) => void value}
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
    const single: string | null = value
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
// @ts-expect-error Single accordion values are scalars.
;<Accordion items={[{ value: 'a' }]} value={['a']} />
// @ts-expect-error Multiple mode does not expose collapsible.
;<Accordion multiple collapsible items={[{ value: 'a' }]} />
// @ts-expect-error Item values are required.
const missingValue: AccordionT.Item = { label: 'Missing' }
void missingValue

;<Resizable value={[300, '70%']} onChange={(sizes: number[]) => void sizes}>
  <Resizable.Panel collapsible onCollapse={(size: number) => void size} />
  <Resizable.Handle intersection />
  <Resizable.Panel />
</Resizable>
// @ts-expect-error The root prop is disabled.
;<Resizable disable />
// @ts-expect-error Panel sizing moved to the root.
;<Resizable.Panel size={300} />
// @ts-expect-error Panel default sizing moved to the root.
;<Resizable.Panel defaultSize="30%" />
// @ts-expect-error Panel resize callbacks moved to the root.
;<Resizable.Panel onResize={() => {}} />

;<AvatarGroup max={0} />
// @ts-expect-error max accepts numbers only.
;<AvatarGroup max="2" />
;<ButtonGroup size="sm" orientation="vertical">
  <ButtonGroup.Separator />
</ButtonGroup>
// @ts-expect-error ButtonGroup supports ComponentSize, not icon sizes.
;<ButtonGroup size="icon-sm" />
// @ts-expect-error Avatar no longer has an idle status.
const idle: AvatarT.Status = 'idle'
void idle
