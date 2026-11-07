import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'

import { useDrawerContent, useDrawerContext } from './drawer-context'
import { drawerRecipe } from './drawer.recipe'
import type { DrawerT } from './drawer.types'

export function DrawerTitle<T extends ValidComponent = 'h2'>(
  props: DrawerT.TitleProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'class', 'style', 'id'])
  const drawer = useDrawerContext()
  const content = useDrawerContent()
  const id = useRegisteredContentId(() => local.id, content.registerTitle)
  const {
    slots: { title: titleSlot },
  } = useRecipe(drawerRecipe, local, {
    slot: 'title',
    context: () => ({ variants: content.variants, ...drawer.slotOverrides }),
  })
  return (
    <Dynamic
      component={local.as ?? 'h2'}
      data-slot="drawer-title"
      {...titleSlot}
      {...rest}
      id={id()}
    />
  )
}
