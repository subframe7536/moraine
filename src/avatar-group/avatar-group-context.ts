import type { Accessor } from 'solid-js'

import { createContextProvider } from '../shared/create-context-provider'

export type AvatarSize = '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export interface AvatarGroupContextValue {
  size: Accessor<AvatarSize | undefined>
}

export const [AvatarGroupProvider, useAvatarGroupContext] =
  createContextProvider<AvatarGroupContextValue | null>('AvatarGroup', null)
