import type { Component } from 'solid-js'

import { DocsApiReferenceWidget } from './docs-api-reference'
import { DocsHeaderWidget } from './docs-header'
import { IntroCardsWidget } from './intro-cards'
import { IntroComponentsWidget } from './intro-components'
import { ToastHostsWidget } from './toast-hosts'

export const docsWidgetMap: Record<string, Component<Record<string, unknown>>> = {
  'docs-api-reference': DocsApiReferenceWidget as Component<Record<string, unknown>>,
  'docs-header': DocsHeaderWidget as Component<Record<string, unknown>>,
  'intro-cards': IntroCardsWidget as Component<Record<string, unknown>>,
  'intro-components': IntroComponentsWidget as Component<Record<string, unknown>>,
  'toast-hosts': ToastHostsWidget as Component<Record<string, unknown>>,
}
