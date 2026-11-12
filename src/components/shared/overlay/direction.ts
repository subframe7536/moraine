export function resolveDirection(element?: Element, explicit?: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  const ownDirection = element?.getAttribute?.('dir')
  if (ownDirection === 'ltr' || ownDirection === 'rtl') {
    return ownDirection
  }

  if (explicit === 'ltr' || explicit === 'rtl') {
    return explicit
  }

  const ownerDocument = element?.ownerDocument
  if (element) {
    const direction = ownerDocument?.defaultView?.getComputedStyle(element).direction
    if (direction === 'ltr' || direction === 'rtl') {
      return direction
    }
  }

  return (ownerDocument?.dir || ownerDocument?.documentElement.dir || 'ltr') === 'rtl'
    ? 'rtl'
    : 'ltr'
}
