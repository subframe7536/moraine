export interface ProgressStyleSlot<T = unknown> {
  /** Progress container that owns track, indicator, labels, and step markers. */
  root?: T

  /** Text region that displays the current progress status. */
  status?: T

  /** Background rail that represents the full progress range. */
  track?: T

  /** Filled bar that represents the current progress value. */
  indicator?: T

  /** Wrapper for step labels when progress is driven by named steps. */
  steps?: T

  /** Individual step label or marker rendered along the progress scale. */
  step?: T
}

export interface ProgressStyleVariant {
  /** Visual layout direction.
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /** Visual animation of the component.
   * @default 'carousel'
   */
  animation?: 'carousel' | 'reverse' | 'swing' | 'elastic'
}
