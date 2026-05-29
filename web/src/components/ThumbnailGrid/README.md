# ThumbnailGrid

Reusable NUI thumbnail picker for appearance categories that can expose a preview grid without replacing the existing NUI callbacks.

## Supported categories

`ThumbnailGrid` accepts `categoryType` values for `components`, `props`, `hair.style`, `headOverlays`, `headBlend`, `tattoos`, and any additional preview-compatible category string.

## Callback mapping

Keep the existing NUI `post` calls in the parent component and pass the same handler into the grid:

- `components` → `appearance_change_component`
- `props` → `appearance_change_prop`
- `hair.style` → `appearance_change_hair`
- `headOverlays` → `appearance_change_head_overlay`
- `tattoos` → `appearance_preview_tattoo`, `appearance_apply_tattoo`, `appearance_delete_tattoo`
- `headBlend` parents → `appearance_change_head_blend`

```tsx
<ThumbnailGrid
  categoryType="components"
  currentIndex={component.drawable}
  currentTexture={component.texture}
  range={settingsById[componentId].drawable}
  blacklist={settingsById[componentId].blacklist}
  active={enabled}
  identity={{ gender, model }}
  imageMetadata={thumbnailMetadata}
  onSelect={(drawable) => handleComponentDrawableChange(componentId, drawable)}
/>
```

Texture changes are intentionally not part of the grid item memoization. Only the selected card receives the current texture indicator, while thumbnail metadata is cached by `gender:model:category:drawable:texture`.
