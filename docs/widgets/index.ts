import type { Component } from 'solid-js'

import { IntroCardsWidget } from './intro-cards'
import { IntroComponentsWidget } from './intro-components'
import { ToastHostsWidget } from './toast-hosts'

export const docsWidgetMap: Record<string, Component<Record<string, unknown>>> = {
  'intro-cards': IntroCardsWidget as Component<Record<string, unknown>>,
  'intro-components': IntroComponentsWidget as Component<Record<string, unknown>>,
  'toast-hosts': ToastHostsWidget as Component<Record<string, unknown>>,
}
