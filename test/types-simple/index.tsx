import { Badge, Button, Card, List, Separator, Slider } from 'moraine'

declare module 'moraine' {
  interface MoraineTypeConfig {
    simpleRootAttributes: true
    simpleHtmlTags: true
  }
}

const acceptSpan = (element: HTMLSpanElement) => element.focus()
const acceptButton = (element: HTMLButtonElement) => element.focus()

// In simpleRootAttributes mode:
// Component props (variant, size, etc.) and ref are typed:
;<Button variant="ghost" size="sm" pressEffect="none" ref={acceptButton} />
;<Badge ref={acceptSpan} />

// Root attributes accept any property via Record<string, unknown>:
;<Badge whatever="arbitrary-custom-attribute" />
;<Card randomProp={123} href="/details" />

// Component-specific props are still strictly checked:
// @ts-expect-error Invalid variant is rejected
;<Button variant="invalid-variant" />

// Polymorphic components with as={Button} still preserve known component props:
;<Button as={Button} variant="ghost" size="sm" />
;<Slider>Slider content</Slider>
// @ts-expect-error Components without content reject children in simplified root mode.
;<Separator children="Unexpected" />

;<List
  as="div"
  items={[{ label: 'Alpha' }]}
  itemRender={(context) => <div>{context.item.label}</div>}
  ref={(element: HTMLDivElement) => {
    const root: HTMLDivElement = element
    void root
  }}
  data-custom="value"
/>
// @ts-expect-error List rejects composed children in simplified root mode.
;<List items={[1]} itemRender={(context) => <li>{context.item}</li>} children={<li />} />
// @ts-expect-error List still requires CSS properties for style.
;<List items={[1]} itemRender={(context) => <li>{context.item}</li>} style="color: red" />
