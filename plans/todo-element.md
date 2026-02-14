# TODO: Element Components (16)

- [ ] alert | nuxt:Alert.vue | coss:alert.tsx | rock:src/alert/ | tests+exports
- [x] avatar | nuxt:Avatar.vue | coss:avatar.tsx | rock:src/avatar/ | tests+exports | note: completed, unblocks form P1 `select`
- [x] avatar-group | nuxt:AvatarGroup.vue | coss:avatar.tsx | rock:src/avatar-group/ | tests+exports
- [ ] badge | nuxt:Badge.vue | coss:badge.tsx | rock:src/badge/ | tests+exports
- [ ] banner | nuxt:Banner.vue | coss:alert.tsx | rock:src/banner/ | tests+exports
- [x] button | nuxt:Button.vue | coss:button.tsx | rock:src/button/ | tests+exports
- [ ] calendar | nuxt:Calendar.vue | coss:select.tsx + popover.tsx | rock:src/calendar/ | tests+exports
- [ ] card | nuxt:Card.vue | coss:card.tsx | rock:src/card/ | tests+exports
- [x] chip | nuxt:Chip.vue | coss:badge.tsx | rock:src/chip/ | tests+exports | note: completed, unblocks form P1 `select`
- [ ] collapsible | nuxt:Collapsible.vue | coss:collapsible.tsx | rock:src/collapsible/ | tests+exports
- [ ] field-group | nuxt:FieldGroup.vue | coss:fieldset.tsx | rock:src/field-group/ | tests+exports
- [ ] kbd | nuxt:Kbd.vue | coss:kbd.tsx | rock:src/kbd/ | tests+exports
- [ ] progress | nuxt:Progress.vue | coss:progress.tsx | rock:src/progress/ | tests+exports
- [ ] separator | nuxt:Separator.vue | coss:separator.tsx | rock:src/separator/ | tests+exports
- [ ] skeleton | nuxt:Skeleton.vue | coss:skeleton.tsx | rock:src/skeleton/ | tests+exports
- [x] icon | nuxt:Icon.vue | coss:none-rock-owned | rock:src/icon/ | tests+exports

## Form P1 Unblock Contract

- `avatar` and `chip` are complete; `plans/todo-form.md` P1 (`select`) is now unblocked.
- Required execution order for unblock path: `avatar` -> `chip` -> `select`.
