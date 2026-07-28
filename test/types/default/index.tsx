import { Badge, Button, Card, List } from 'moraine'
import type { Component, JSX } from 'solid-js'

const CustomRoot: Component<{ required: string; children?: JSX.Element }> = (props) => (
  <section data-required={props.required}>{props.children}</section>
)

;<Badge aria-label="status" data-testid="badge">
  Ready
</Badge>
;<Button onClick={() => undefined}>Save</Button>
;<Card aria-describedby="details" />
;<Button as={CustomRoot} required="yes" />
;<List items={[1, 2]} itemRender={(context) => context.item} />

const acceptSpan = (element: HTMLSpanElement) => element.focus()
const divRef = (element: HTMLDivElement) => element.focus()

;<Badge ref={(element) => acceptSpan(element)} />

// @ts-expect-error Badge's root ref must target HTMLSpanElement.
;<Badge ref={divRef} />

;<Badge id="badge" />
;<Card onClick={() => undefined} />
;<Card href="/details" />
// @ts-expect-error Required custom component props remain required through `as`.
;<Button as={CustomRoot} />
;<List id="items" items={[1]} itemRender={(context) => context.item} />
