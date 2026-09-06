import type { JSX, Owner } from 'solid-js'
import { createContext, getOwner, useContext } from 'solid-js'

import { getEmptyDesign } from '../../design/empty-design.ts'
import type { MoraineDesign } from '../../design/types.ts'
import type { SlotClassValue } from '../types.ts'
import { cn } from '../utils.ts'

/** A single level in the component's class and inline-style cascade. */
export interface ComponentStyleLayer<S extends string> {
  classes?: Partial<Record<S, SlotClassValue>>
  styles?: Partial<Record<S, JSX.CSSProperties>>
}

export interface ComponentStyleInputs<S extends string> {
  base?: ComponentStyleLayer<S>
  design?: ComponentStyleLayer<S>
  group?: ComponentStyleLayer<S>
  state?: ComponentStyleLayer<S>
  instance?: ComponentStyleLayer<S> & {
    class?: SlotClassValue
    style?: JSX.CSSProperties
  }
  /** Slot receiving the root class/style props. Defaults to root. */
  rootSlot?: NoInfer<S>
}

export interface SlotOverride {
  group?: { class?: SlotClassValue; style?: JSX.CSSProperties }
  state?: { class?: SlotClassValue; style?: JSX.CSSProperties }
}

export interface SlotBinding {
  readonly class: string | undefined
  readonly style: JSX.CSSProperties
}

export interface ResolvedComponentStyle<S extends string> {
  rootClass: (override?: SlotOverride) => string | undefined
  rootStyle: (override?: SlotOverride) => JSX.CSSProperties
  rootClassAndStyle: (override?: SlotOverride) => SlotBinding
  slotClass: (slot: S, override?: SlotOverride) => string | undefined
  slotStyle: (slot: S, override?: SlotOverride) => JSX.CSSProperties
  slotClassAndStyle: (slot: S, override?: SlotOverride) => SlotBinding
}

/**
 * Resolves styling in order: base → design → group → state → instance.
 * Root props follow instance slot overrides. Per-call overrides belong to their
 * named level. Inputs and bindings retain getters so JSX owns reactive tracking.
 */
export function resolveComponentStyle<S extends string>(
  inputs: ComponentStyleInputs<S>,
): ResolvedComponentStyle<S> {
  function resolveSlot(slot: S, override?: SlotOverride): SlotBinding {
    return {
      get class() {
        return cn(
          inputs.base?.classes?.[slot],
          inputs.design?.classes?.[slot],
          inputs.group?.classes?.[slot],
          override?.group?.class,
          inputs.state?.classes?.[slot],
          override?.state?.class,
          inputs.instance?.classes?.[slot],
          slot === (inputs.rootSlot ?? 'root') && inputs.instance?.class,
        )
      },
      get style() {
        return {
          ...inputs.base?.styles?.[slot],
          ...inputs.design?.styles?.[slot],
          ...inputs.group?.styles?.[slot],
          ...override?.group?.style,
          ...inputs.state?.styles?.[slot],
          ...override?.state?.style,
          ...inputs.instance?.styles?.[slot],
          ...(slot === (inputs.rootSlot ?? 'root') ? inputs.instance?.style : undefined),
        }
      },
    }
  }

  return {
    rootClass: (override) => resolveSlot(inputs.rootSlot ?? ('root' as S), override).class,
    rootStyle: (override) => resolveSlot(inputs.rootSlot ?? ('root' as S), override).style,
    rootClassAndStyle: (override) => ({
      get class() {
        return resolveSlot(inputs.rootSlot ?? ('root' as S), override).class
      },
      get style() {
        return resolveSlot(inputs.rootSlot ?? ('root' as S), override).style
      },
    }),
    slotClass: (slot, override) => resolveSlot(slot, override).class,
    slotStyle: (slot, override) => resolveSlot(slot, override).style,
    slotClassAndStyle: resolveSlot,
  }
}

export interface MoraineProviderProps {
  design: MoraineDesign
  children?: JSX.Element
}

export const MoraineDesignContext = createContext<(() => MoraineDesign) | undefined>()
const warnedOwners = new WeakSet<Owner>()

export function useMoraineDesign(): () => MoraineDesign {
  const context = useContext(MoraineDesignContext)
  if (context) {
    return context
  }

  if (process.env.NODE_ENV !== 'production') {
    let owner = getOwner()
    while (owner?.owner) {
      owner = owner.owner
    }
    if (!owner || !warnedOwners.has(owner)) {
      if (owner) {
        warnedOwners.add(owner)
      }
      console.warn(
        '[Moraine] Component rendered outside of MoraineProvider. Rendering unstyled. Wrap your application in <MoraineProvider design={...}> to enable presentation.',
      )
    }
  }
  return getEmptyDesign
}

export function MoraineProvider(props: MoraineProviderProps): JSX.Element {
  return (
    <MoraineDesignContext.Provider value={() => props.design}>
      {props.children}
    </MoraineDesignContext.Provider>
  )
}
