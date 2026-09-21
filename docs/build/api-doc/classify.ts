import type { PropGroup, PropTrait, StateRelation } from './types'

const POSITIONING_PROPS = new Set([
  'gutter',
  'overflowPadding',
  'placement',
  'offset',
  'shift',
  'flip',
  'arrow',
  'arrowPadding',
  'boundary',
  'anchor',
  'fit',
  'sameWidth',
])

const STYLING_PROPS = new Set([
  'class',
  'style',
  'classes',
  'styles',
  'variant',
  'size',
  'color',
  'orientation',
  'fullscreen',
  'radius',
])

const FORM_PROPS = new Set([
  'name',
  'required',
  'readOnly',
  'serializeValue',
  'onReset',
  'onSubmit',
  'onInvalid',
  'validate',
  'form',
])

const DATA_PROPS = new Set([
  'items',
  'itemToLabelString',
  'isItemDisabled',
  'options',
  'data',
  'columns',
  'rows',
  'filterItem',
])

const RENDERING_PROPS = new Set([
  'children',
  'as',
  'leading',
  'trailing',
  'leadingIcon',
  'trailingIcon',
  'closeIcon',
  'loadingIcon',
  'clearIcon',
  'expandIcon',
  'collapseIcon',
  'title',
  'description',
  'label',
  'header',
  'footer',
  'body',
  'badge',
  'content',
])

const BEHAVIOR_PROPS = new Set([
  'dismissible',
  'closeOnSelect',
  'loop',
  'onExitComplete',
  'onClosePrevent',
  'trapFocus',
  'preventScroll',
  'unmountOnHide',
  'forceMount',
  'transition',
  'activationMode',
  'autoFocus',
  'disabled',
  'loading',
  'loadingAuto',
  'allowClear',
  'onClear',
  'scrollable',
  'search',
  'createItem',
  'maxCount',
  'maxTagCount',
  'tokenSeparators',
  'openOnControlClick',
  'keepMounted',
  'lazy',
  'multiple',
])

export function deriveStateRelation(propName: string): StateRelation | undefined {
  if (propName === 'value') {
    return { key: 'value', role: 'value' }
  }
  if (propName === 'defaultValue') {
    return { key: 'value', role: 'default' }
  }
  if (propName === 'onChange') {
    return { key: 'value', role: 'change' }
  }
  if (propName === 'open') {
    return { key: 'open', role: 'value' }
  }
  if (propName === 'defaultOpen') {
    return { key: 'open', role: 'default' }
  }
  if (propName === 'onOpenChange') {
    return { key: 'open', role: 'change' }
  }
  if (propName === 'checked') {
    return { key: 'checked', role: 'value' }
  }
  if (propName === 'defaultChecked') {
    return { key: 'checked', role: 'default' }
  }
  if (propName === 'onCheckedChange') {
    return { key: 'checked', role: 'change' }
  }
  if (propName === 'active') {
    return { key: 'active', role: 'value' }
  }
  if (propName === 'defaultActive') {
    return { key: 'active', role: 'default' }
  }
  if (propName === 'onActiveChange') {
    return { key: 'active', role: 'change' }
  }
  if (propName === 'expanded') {
    return { key: 'expanded', role: 'value' }
  }
  if (propName === 'defaultExpanded') {
    return { key: 'expanded', role: 'default' }
  }
  if (propName === 'onExpandedChange') {
    return { key: 'expanded', role: 'change' }
  }
  if (propName === 'pressed') {
    return { key: 'pressed', role: 'value' }
  }
  if (propName === 'defaultPressed') {
    return { key: 'pressed', role: 'default' }
  }
  if (propName === 'onPressedChange') {
    return { key: 'pressed', role: 'change' }
  }
  if (propName === 'selected') {
    return { key: 'selected', role: 'value' }
  }
  if (propName === 'defaultSelected') {
    return { key: 'selected', role: 'default' }
  }
  if (propName === 'onSelectedChange') {
    return { key: 'selected', role: 'change' }
  }
  if (propName === 'page') {
    return { key: 'page', role: 'value' }
  }
  if (propName === 'defaultPage') {
    return { key: 'page', role: 'default' }
  }
  if (propName === 'onPageChange') {
    return { key: 'page', role: 'change' }
  }
  if (propName === 'searchValue') {
    return { key: 'search', role: 'value' }
  }
  if (propName === 'defaultSearchValue') {
    return { key: 'search', role: 'default' }
  }
  if (propName === 'onSearch') {
    return { key: 'search', role: 'change' }
  }

  const defaultMatch = propName.match(/^default([A-Z].*)$/)
  if (defaultMatch) {
    const rawKey = defaultMatch[1]!
    const key = rawKey.charAt(0).toLowerCase() + rawKey.slice(1)
    return { key, role: 'default' }
  }

  const changeMatch = propName.match(/^on([A-Z].*)Change$/)
  if (changeMatch) {
    const rawKey = changeMatch[1]!
    const key = rawKey.charAt(0).toLowerCase() + rawKey.slice(1)
    return { key, role: 'change' }
  }

  return undefined
}

export function classifyPropGroup(propName: string, _typeText: string = ''): PropGroup {
  // 1. State relation props
  if (deriveStateRelation(propName)) {
    return 'state'
  }

  // 2. Exact matches
  if (STYLING_PROPS.has(propName)) {
    return 'styling'
  }
  if (DATA_PROPS.has(propName)) {
    return 'data'
  }
  if (FORM_PROPS.has(propName)) {
    return 'form'
  }
  if (RENDERING_PROPS.has(propName)) {
    return 'rendering'
  }
  if (BEHAVIOR_PROPS.has(propName)) {
    return 'behavior'
  }
  if (POSITIONING_PROPS.has(propName)) {
    return 'behavior'
  }

  // 3. Render prop conventions
  if (
    propName.endsWith('Render') ||
    propName.endsWith('Renderer') ||
    propName.endsWith('Template') ||
    propName === 'tagOverflow' ||
    propName === 'tagRender'
  ) {
    return 'rendering'
  }

  // 4. Icon conventions
  if (propName.endsWith('Icon')) {
    return 'rendering'
  }

  // 5. Callback / event conventions
  if (/^on[A-Z]/.test(propName)) {
    if (propName === 'onSubmit' || propName === 'onReset' || propName === 'onInvalid') {
      return 'form'
    }
    return 'behavior'
  }

  // 6. Common prefixes
  if (propName.startsWith('is') || propName.startsWith('has') || propName.startsWith('can')) {
    return 'behavior'
  }

  // Fallback to behavior
  return 'behavior'
}

export function derivePropTraits(propName: string, typeText: string = ''): PropTrait[] {
  const traits: PropTrait[] = []

  const isPositioning = POSITIONING_PROPS.has(propName)
  if (isPositioning) {
    traits.push('positioning')
  }

  const isRenderProp =
    propName.endsWith('Render') ||
    propName.endsWith('Renderer') ||
    propName.endsWith('Template') ||
    propName === 'tagOverflow' ||
    propName === 'tagRender' ||
    (propName === 'children' &&
      (typeText.includes('=>') ||
        typeText.includes('ComponentOrElement') ||
        typeText.includes('RenderProps')))

  if (isRenderProp) {
    traits.push('render-prop')
  }

  const isCallback =
    /^on[A-Z]/.test(propName) ||
    (!isRenderProp &&
      (typeText.includes('=>') ||
        typeText.includes('(() =>') ||
        typeText.includes('Handler') ||
        typeText.includes('Function')))

  if (isCallback || (isRenderProp && typeText.includes('=>'))) {
    traits.push('callback')
  }

  return traits
}
