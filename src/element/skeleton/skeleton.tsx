import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'

import { skeletonRecipe } from './skeleton.recipe'
import type { SkeletonProps } from './skeleton.types'

/** Animated placeholder for content that is still loading. */
export function Skeleton(props: SkeletonProps): JSX.Element {
  const [local, rest] = splitProps(props, ['variant', 'class', 'style', 'classes', 'styles'])
  const resolved = createStyles(skeletonRecipe, local)

  return <div data-slot="skeleton" {...rest} {...resolved.styles.root} />
}
