import type { IconT } from '../../../icon'

export const FEEDBACK_TYPE_ICONS = {
  info: 'icon-info',
  success: 'icon-success',
  warning: 'icon-warning',
  error: 'icon-error',
  loading: 'icon-loading',
} as const

export function resolveFeedbackIcon(options: {
  type?: string
  icon?: IconT.Name
}): IconT.Name | undefined {
  if (options.icon !== undefined) {
    return options.icon
  }
  if (options.type && options.type !== 'default' && options.type in FEEDBACK_TYPE_ICONS) {
    return FEEDBACK_TYPE_ICONS[options.type as keyof typeof FEEDBACK_TYPE_ICONS]
  }
  return undefined
}
