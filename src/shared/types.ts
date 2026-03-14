/**
 * Utility to compose component props by combining base props with external props.
 * Automatically omits conflicting keys from the external props, as well as 'children' and 'class'.
 */
export type RockUIComposeProps<B, E, ExtraOmitKeys extends keyof any = never> = B &
  Omit<E, keyof B | 'children' | 'class' | 'style' | ExtraOmitKeys>
