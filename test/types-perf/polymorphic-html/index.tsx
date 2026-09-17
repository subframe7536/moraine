import { Button, Dialog, Field } from 'moraine'

const acceptAnchor = (element: HTMLAnchorElement) => element.focus()
const acceptButton = (element: HTMLButtonElement) => element.focus()
const acceptInput = (element: HTMLInputElement) => element.focus()
const acceptSection = (element: HTMLElement) => element.focus()

;<Button
  as="a"
  href="/docs"
  target="_blank"
  rel="noreferrer"
  ref={acceptAnchor}
  onClick={(event) => {
    const anchor: HTMLAnchorElement = event.currentTarget
    anchor.focus()
  }}
/>
;<Button
  as="button"
  type="submit"
  ref={acceptButton}
  onKeyDown={(event) => event.currentTarget.focus()}
/>
;<Button
  as="input"
  type="checkbox"
  ref={acceptInput}
  onChange={(event) => event.currentTarget.focus()}
/>
;<Field as="section" ref={acceptSection} aria-label="Profile" />
;<Dialog.Trigger as="a" href="/open" ref={acceptAnchor}>
  Open
</Dialog.Trigger>
;<Button as="svg" viewBox="0 0 24 24" aria-label="icon root" />

// @ts-expect-error Anchor roots reject button-only form attributes.
;<Button as="a" formAction="/submit" />
// @ts-expect-error Button roots reject anchor-only href.
;<Button as="button" href="/docs" />
// @ts-expect-error Anchor refs must receive HTMLAnchorElement.
;<Button as="a" ref={acceptButton} />
// @ts-expect-error Field section roots reject anchor-only href.
;<Field as="section" href="/docs" />
