import { Icon } from '../../../../src/elements/icon/icon.tsx'

// Create JSX within each host's Solid owner.
export function createMoraineToastIcons() {
  return {
    success: <Icon name="icon-success" />,
    error: <Icon name="icon-error" />,
    warning: <Icon name="icon-warning" />,
    info: <Icon name="icon-info" />,
    loading: <Icon name="icon-loading" class="animate-spin" />,
    close: <Icon name="icon-close" />,
  }
}
