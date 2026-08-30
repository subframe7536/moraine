import { fireEvent } from '@solidjs/testing-library'
import { expect } from 'vitest'

/**
 * Dispatches animationEnd and transitionEnd events on all open or closing content
 * and overlay slots to settle exit motion transitions in tests.
 */
export async function finishExitMotion(
  targetContent?: HTMLElement | null,
  targetOverlay?: HTMLElement | null,
): Promise<void> {
  await Promise.resolve()

  const contents = targetContent
    ? [targetContent]
    : (Array.from(document.body.querySelectorAll('[data-slot="content"]')) as HTMLElement[])
  const overlays = targetOverlay
    ? [targetOverlay]
    : (Array.from(document.body.querySelectorAll('[data-slot="overlay"]')) as HTMLElement[])

  for (const content of contents) {
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)
  }

  for (const overlay of overlays) {
    fireEvent.animationEnd(overlay)
    fireEvent.transitionEnd(overlay)
  }
}

/**
 * Dispatches animationEnd and transitionEnd events on all menu content slots.
 */
export async function finishMenuExitMotion(): Promise<void> {
  await Promise.resolve()

  const contents = Array.from(
    document.body.querySelectorAll('[data-slot="content"]'),
  ) as HTMLElement[]
  for (const content of contents) {
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)
  }
}

/**
 * Asserts that the element has no placement transition offset styles active.
 */
export function expectNoPlacementMotion(element: HTMLElement | null | undefined): void {
  expect(element?.style.getPropertyValue('--mo-enter-translate-x')).toBe('')
  expect(element?.style.getPropertyValue('--mo-enter-translate-y')).toBe('')
  expect(element?.style.getPropertyValue('--mo-exit-translate-x')).toBe('')
  expect(element?.style.getPropertyValue('--mo-exit-translate-y')).toBe('')
}
