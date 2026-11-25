/** Returns the DOM slot owned by a public component. */
export function dataSlotName(owner: string, slot: string): string {
  if (slot === 'root') {
    return owner
  }
  return `${owner}-${slot.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}
