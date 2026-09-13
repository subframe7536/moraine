import { Badge, Button, Card } from 'moraine'

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
;<Button variant="ghost" size="sm" ref={acceptButton} />
;<Badge ref={acceptSpan} />

// Root attributes accept any property via Record<string, unknown>:
;<Badge whatever="arbitrary-custom-attribute" />
;<Card randomProp={123} href="/details" />

// Component-specific props are still strictly checked:
// @ts-expect-error Invalid variant is rejected
;<Button variant="invalid-variant" />

// Polymorphic components with as={Button} still preserve known component props:
;<Button as={Button} variant="ghost" size="sm" />
