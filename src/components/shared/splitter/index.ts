export { createSplitterHandle } from './create-splitter-handle'
export type { CreateSplitterHandleOptions, SplitterHandleBindings } from './create-splitter-handle'
export { splitterDataAttributes } from './splitter.recipe'
export {
  SPLITTER_END_TARGET_ATTRIBUTE,
  SPLITTER_ROOT_ATTRIBUTE,
  SPLITTER_ROOT_SELECTOR,
  SPLITTER_START_TARGET_ATTRIBUTE,
  SPLITTER_TARGET_SELECTOR,
  refreshSplitterIntersections,
  registerSplitterHandle,
  scheduleSplitterIntersectionsRefresh,
  startSplitterDrag,
  updateSplitterIntersectionHover,
} from './manager'
export type {
  SplitterHandleRegistration,
  SplitterIntersectionEdge,
  SplitterIntersectionTarget,
  SplitterOrientation,
} from './manager'
