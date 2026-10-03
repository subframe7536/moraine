import type { ComponentStyleConfig } from '../../theme/types'

export interface SkeletonStyleSlot<T = unknown> {
  /** Placeholder surface. */
  root?: T
}

export interface SkeletonStyleVariant {
  /** Loading animation displayed by the placeholder.
   * @default 'pulse'
   */
  variant?: 'pulse' | 'shimmer'
}

export type SkeletonStyleConfig = ComponentStyleConfig<SkeletonStyleSlot, SkeletonStyleVariant>
