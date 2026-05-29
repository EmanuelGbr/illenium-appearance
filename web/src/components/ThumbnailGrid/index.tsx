import React, { memo, useMemo } from "react";

import "./styles.css";
import type {
  ThumbnailAssetMetadata,
  ThumbnailBlacklist,
  ThumbnailCacheKeyParts,
  ThumbnailGridItem,
  ThumbnailGridProps,
  ThumbnailMetadataCollection,
} from "./types";

const thumbnailMetadataCache = new Map<
  string,
  ThumbnailAssetMetadata | undefined
>();

export const buildThumbnailCacheKey = ({
  gender = "unknown",
  model = "unknown",
  categoryType,
  drawable,
  texture = -1,
}: ThumbnailCacheKeyParts): string =>
  [gender, model, categoryType, drawable, texture].join(":");

const readMetadata = (
  imageMetadata: ThumbnailMetadataCollection | undefined,
  categoryType: string,
  drawable: number,
  texture?: number,
): ThumbnailAssetMetadata | undefined => {
  if (!imageMetadata) return undefined;

  if (Array.isArray(imageMetadata)) {
    return imageMetadata.find((metadata) => {
      const metadataDrawable = metadata.drawable as number | undefined;
      const metadataCategory = metadata.categoryType as string | undefined;
      const metadataTexture = metadata.texture;
      const matchesDrawable = metadataDrawable === drawable;
      const matchesCategory =
        !metadataCategory || metadataCategory === categoryType;
      const matchesTexture =
        texture === undefined ||
        metadataTexture === undefined ||
        metadataTexture === texture;

      return matchesDrawable && matchesCategory && matchesTexture;
    });
  }

  const keys = [
    `${categoryType}:${drawable}:${texture ?? -1}`,
    `${categoryType}:${drawable}`,
    `${drawable}:${texture ?? -1}`,
    String(drawable),
  ];

  for (const key of keys) {
    const metadata = imageMetadata[key];
    if (metadata) return metadata;
  }

  return undefined;
};

export const getCachedThumbnailMetadata = (
  imageMetadata: ThumbnailMetadataCollection | undefined,
  cacheKeyParts: ThumbnailCacheKeyParts,
): ThumbnailAssetMetadata | undefined => {
  const cacheKey = buildThumbnailCacheKey(cacheKeyParts);

  if (!thumbnailMetadataCache.has(cacheKey)) {
    thumbnailMetadataCache.set(
      cacheKey,
      readMetadata(
        imageMetadata,
        cacheKeyParts.categoryType,
        cacheKeyParts.drawable,
        cacheKeyParts.texture,
      ),
    );
  }

  return thumbnailMetadataCache.get(cacheKey);
};

export const clearThumbnailMetadataCache = (): void => {
  thumbnailMetadataCache.clear();
};

const listRange = ({ min, max }: ThumbnailGridProps["range"]): number[] => {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : safeMin;
  const length = Math.max(0, safeMax - safeMin + 1);

  return Array.from({ length }, (_, index) => safeMin + index);
};

const blacklistHas = (
  blacklist: ThumbnailBlacklist | number[] | undefined,
  drawable: number,
): boolean => {
  if (!blacklist) return false;
  if (Array.isArray(blacklist)) return blacklist.includes(drawable);

  return Boolean(
    blacklist.drawables?.includes(drawable) ||
    blacklist.items?.some((item) => String(item) === String(drawable)),
  );
};

const fallbackLabel = (
  item: ThumbnailGridItem,
  categoryType: string,
): string => {
  if (item.label) return item.label;
  if (item.metadata?.label) return item.metadata.label;

  return `${categoryType.replace(".", " ")} #${item.drawable}`;
};

const thumbnailSrc = (
  metadata: ThumbnailAssetMetadata | undefined,
): string | undefined => metadata?.src || metadata?.url;

interface CardProps {
  item: ThumbnailGridItem;
  categoryType: string;
  selected: boolean;
  texture?: number;
  active: boolean;
  textureBlacklisted: boolean;
  textureLabel: string;
  disabledLabel: string;
  activeLabel: string;
  onSelect?: ThumbnailGridProps["onSelect"];
  tattooCallbacks?: ThumbnailGridProps["tattooCallbacks"];
  renderActions?: ThumbnailGridProps["renderActions"];
}

const ThumbnailCard = memo(
  ({
    item,
    categoryType,
    selected,
    texture,
    active,
    textureBlacklisted,
    textureLabel,
    disabledLabel,
    activeLabel,
    onSelect,
    tattooCallbacks,
    renderActions,
  }: CardProps) => {
    const disabled =
      !active ||
      item.disabled ||
      item.active === false ||
      item.metadata?.disabled ||
      item.metadata?.active === false ||
      textureBlacklisted;
    const label = fallbackLabel(item, categoryType);
    const src = thumbnailSrc(item.metadata);
    const icon = item.icon || item.metadata?.icon;

    const handleSelect = () => {
      if (disabled) return;

      if (categoryType === "tattoos" && tattooCallbacks?.onPreview) {
        tattooCallbacks.onPreview(item);
        return;
      }

      onSelect?.(item.drawable, item);
    };

    return (
      <div
        className={[
          "thumbnail-grid__card",
          selected ? "thumbnail-grid__card--selected" : "",
          disabled ? "thumbnail-grid__card--inactive" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="option"
        aria-selected={selected}
        aria-disabled={disabled}
      >
        <button
          type="button"
          className="thumbnail-grid__select"
          aria-pressed={selected}
          disabled={disabled}
          onClick={handleSelect}
        >
          <span className="thumbnail-grid__preview">
            {src ? (
              <img
                className="thumbnail-grid__image"
                src={src}
                alt={item.metadata?.alt || label}
                loading="lazy"
              />
            ) : (
              <span className="thumbnail-grid__fallback" aria-hidden="true">
                {icon ? (
                  <span className="thumbnail-grid__icon">{icon}</span>
                ) : (
                  item.drawable
                )}
              </span>
            )}

            <span className="thumbnail-grid__badges">
              {selected && (
                <span className="thumbnail-grid__badge thumbnail-grid__badge--selected">
                  {activeLabel}
                </span>
              )}
              {selected && texture !== undefined && (
                <span className="thumbnail-grid__badge">
                  {textureLabel} {texture}
                </span>
              )}
              {disabled && (
                <span className="thumbnail-grid__badge thumbnail-grid__badge--inactive">
                  {disabledLabel}
                </span>
              )}
            </span>
          </span>

          <span className="thumbnail-grid__content">
            <span className="thumbnail-grid__label" title={label}>
              {label}
            </span>
            <span className="thumbnail-grid__meta">ID {item.drawable}</span>
          </span>
        </button>

        {(renderActions || categoryType === "tattoos") && (
          <span className="thumbnail-grid__actions">
            {renderActions?.(item)}
            {categoryType === "tattoos" && tattooCallbacks?.onApply && (
              <button
                className="thumbnail-grid__action"
                type="button"
                disabled={disabled}
                onClick={() => tattooCallbacks.onApply?.(item)}
              >
                Apply
              </button>
            )}
            {categoryType === "tattoos" && tattooCallbacks?.onDelete && (
              <button
                className="thumbnail-grid__action"
                type="button"
                disabled={disabled}
                onClick={() => tattooCallbacks.onDelete?.(item)}
              >
                Delete
              </button>
            )}
          </span>
        )}
      </div>
    );
  },
  (previous, next) =>
    previous.item === next.item &&
    previous.selected === next.selected &&
    previous.texture === next.texture &&
    previous.active === next.active &&
    previous.textureBlacklisted === next.textureBlacklisted &&
    previous.onSelect === next.onSelect &&
    previous.tattooCallbacks === next.tattooCallbacks &&
    previous.renderActions === next.renderActions,
);

ThumbnailCard.displayName = "ThumbnailCard";

const ThumbnailGrid = ({
  categoryType,
  currentIndex,
  currentTexture,
  range,
  blacklist,
  active = true,
  imageMetadata,
  items,
  identity,
  label,
  textureLabel = "Texture",
  disabledLabel = "Off",
  activeLabel = "Selected",
  emptyLabel = "No preview options available",
  className,
  onSelect,
  tattooCallbacks,
  renderActions,
}: ThumbnailGridProps) => {
  const gridItems = useMemo(() => {
    const sourceItems =
      items ?? listRange(range).map((drawable) => ({ drawable }));

    return sourceItems.map((sourceItem) => {
      const metadata =
        sourceItem.metadata ??
        getCachedThumbnailMetadata(imageMetadata, {
          gender: identity?.gender,
          model: identity?.model,
          categoryType,
          drawable: sourceItem.drawable,
          texture: sourceItem.texture,
        });

      const blacklisted = blacklistHas(blacklist, sourceItem.drawable);

      return {
        ...sourceItem,
        metadata,
        disabled: sourceItem.disabled || blacklisted,
      };
    });
  }, [
    blacklist,
    categoryType,
    identity?.gender,
    identity?.model,
    imageMetadata,
    items,
    range.max,
    range.min,
  ]);

  if (gridItems.length === 0) {
    return <div className="thumbnail-grid__empty">{emptyLabel}</div>;
  }

  return (
    <div
      className={["thumbnail-grid", className].filter(Boolean).join(" ")}
      role="listbox"
      aria-label={label || categoryType}
    >
      {gridItems.map((item) => {
        const selected = item.drawable === currentIndex;
        const texture = selected ? currentTexture : item.texture;
        const textureBlacklisted = selected
          ? textureBlacklistHas(blacklist, currentTexture)
          : false;

        return (
          <ThumbnailCard
            key={item.id ?? `${categoryType}:${item.drawable}`}
            item={item}
            categoryType={categoryType}
            selected={selected}
            texture={texture}
            active={active}
            textureBlacklisted={textureBlacklisted}
            textureLabel={textureLabel}
            disabledLabel={disabledLabel}
            activeLabel={activeLabel}
            onSelect={onSelect}
            tattooCallbacks={tattooCallbacks}
            renderActions={renderActions}
          />
        );
      })}
    </div>
  );
};

export default memo(ThumbnailGrid);
export type {
  ThumbnailAssetMetadata,
  ThumbnailBlacklist,
  ThumbnailCacheKeyParts,
  ThumbnailCategoryType,
  ThumbnailGridItem,
  ThumbnailGridProps,
  ThumbnailIdentity,
  ThumbnailMetadataCollection,
  ThumbnailRange,
  TattooThumbnailCallbacks,
} from "./types";
