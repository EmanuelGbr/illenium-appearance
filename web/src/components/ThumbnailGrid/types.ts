import type { ReactNode } from "react";

export type ThumbnailCategoryType =
  | "components"
  | "props"
  | "hair.style"
  | "headOverlays"
  | "headBlend"
  | "tattoos"
  | "preview";

export interface ThumbnailRange {
  min: number;
  max: number;
}

export interface ThumbnailAssetMetadata {
  src?: string;
  url?: string;
  alt?: string;
  label?: string;
  icon?: ReactNode;
  texture?: number;
  disabled?: boolean;
  active?: boolean;
  [key: string]: unknown;
}

export type ThumbnailMetadataCollection =
  | ThumbnailAssetMetadata[]
  | Record<string, ThumbnailAssetMetadata | undefined>;

export interface ThumbnailGridItem {
  id?: string | number;
  drawable: number;
  texture?: number;
  label?: string;
  icon?: ReactNode;
  disabled?: boolean;
  active?: boolean;
  metadata?: ThumbnailAssetMetadata;
  payload?: unknown;
}

export interface ThumbnailBlacklist {
  drawables?: number[];
  textures?: number[];
  items?: Array<number | string>;
  [key: string]: unknown;
}

export interface ThumbnailIdentity {
  gender?: string;
  model?: string;
}

export interface TattooThumbnailCallbacks {
  onPreview?: (item: ThumbnailGridItem, opacity?: number) => void;
  onApply?: (item: ThumbnailGridItem, opacity?: number) => void;
  onDelete?: (item: ThumbnailGridItem) => void;
}

export interface ThumbnailGridProps {
  categoryType: ThumbnailCategoryType | string;
  currentIndex: number;
  currentTexture?: number;
  range: ThumbnailRange;
  blacklist?: ThumbnailBlacklist | number[];
  active?: boolean;
  imageMetadata?: ThumbnailMetadataCollection;
  items?: ThumbnailGridItem[];
  identity?: ThumbnailIdentity;
  label?: string;
  textureLabel?: string;
  disabledLabel?: string;
  activeLabel?: string;
  emptyLabel?: string;
  className?: string;
  onSelect?: (drawable: number, item: ThumbnailGridItem) => void;
  onTextureSelect?: (texture: number, item: ThumbnailGridItem) => void;
  tattooCallbacks?: TattooThumbnailCallbacks;
  renderActions?: (item: ThumbnailGridItem) => ReactNode;
}

export interface ThumbnailCacheKeyParts extends ThumbnailIdentity {
  categoryType: string;
  drawable: number;
  texture?: number;
}
