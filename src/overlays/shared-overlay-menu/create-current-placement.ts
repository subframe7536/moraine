import type { Accessor } from 'solid-js'
import { createMemo, createSignal } from 'solid-js'

import { resolveOverlayMenuSide } from './utils'
import type { OverlayMenuPlacement, OverlayMenuSide } from './utils'

interface CreateCurrentPlacementProps {
  fallbackPlacement: Accessor<OverlayMenuPlacement>
  onChange?: (placement: string) => void
}

export function createCurrentPlacement(props: CreateCurrentPlacementProps) {
  const [currentPlacement, setCurrentPlacement] = createSignal<string | undefined>(undefined)

  const resolvedSide = createMemo<OverlayMenuSide>(() =>
    resolveOverlayMenuSide(currentPlacement() ?? props.fallbackPlacement()),
  )

  function onCurrentPlacementChange(placement: string): void {
    setCurrentPlacement(placement)
    props.onChange?.(placement)
  }

  return {
    currentPlacement,
    onCurrentPlacementChange,
    resolvedSide,
  }
}
