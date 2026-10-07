export const POPPER_CONTENT_MAX_HEIGHT_CLASS = 'max-h-(--mo-popper-content-available-height)'
export const POPPER_CONTENT_MAX_WIDTH_CLASS = 'max-w-(--mo-popper-content-available-width)'
export const POPPER_CONTENT_MAX_SIZE_CLASS = `${POPPER_CONTENT_MAX_HEIGHT_CLASS}  ${POPPER_CONTENT_MAX_WIDTH_CLASS}`

export const POPPER_SIDE_Y_CLASS =
  'data-[side=bottom]:mt-(--mo-popper-content-overflow-padding) data-[side=top]:mb-(--mo-popper-content-overflow-padding) data-[side=top]:enter-translate-y-1 data-[side=top]:exit-translate-y-1 data-[side=bottom]:-enter-translate-y-1 data-[side=bottom]:-exit-translate-y-1'
export const POPPER_SIDE_X_CLASS =
  'data-[side=left]:mr-(--mo-popper-content-overflow-padding) data-[side=right]:ml-(--mo-popper-content-overflow-padding) data-[side=left]:enter-translate-x-1 data-[side=left]:exit-translate-x-1 data-[side=right]:-enter-translate-x-1 data-[side=right]:-exit-translate-x-1'
export const POPPER_SIDE_CLASS = `${POPPER_SIDE_Y_CLASS}  ${POPPER_SIDE_X_CLASS}`
