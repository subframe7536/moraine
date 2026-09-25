import {
  Avatar,
  Badge,
  BaseSelect,
  Card,
  Icon,
  Input,
  Kbd,
  List,
  Progress,
  Separator,
  Slider,
  Textarea,
} from 'moraine'

;<Badge>Badge text</Badge>
;<Card>Card content</Card>
;<Slider>Slider content</Slider>
;<BaseSelect.Control>Control content</BaseSelect.Control>
;<BaseSelect.Content>Popup content</BaseSelect.Content>

// @ts-expect-error Avatar renders its own image and fallback.
;<Avatar children="Unexpected" />
// @ts-expect-error Icon content comes from name.
;<Icon name="i-lucide-search" children="Unexpected" />
// @ts-expect-error Kbd content comes from value.
;<Kbd value="K" children="Unexpected" />
// @ts-expect-error Input does not accept child content.
;<Input children="Unexpected" />
// @ts-expect-error List rows come from itemRender.
;<List items={[1]} itemRender={(context) => <li>{context.item}</li>} children="Unexpected" />
// @ts-expect-error Progress renders its own status and steps.
;<Progress children="Unexpected" />
// @ts-expect-error Separator does not render content.
;<Separator children="Unexpected" />
// @ts-expect-error Textarea does not accept child content.
;<Textarea children="Unexpected" />
