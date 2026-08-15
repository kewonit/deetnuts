import type { StaticImageSource } from "@/lib/static-image";
import { cn } from "@/lib/utils";

export type StaticPictureProps = {
  src: StaticImageSource;
  width: number;
  height: number;
  alt?: string;
  className?: string;
  pictureClassName?: string;
  decorative?: boolean;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  sizes?: string;
};

export function StaticPicture({
  src,
  width,
  height,
  alt = "",
  className,
  pictureClassName,
  decorative = true,
  priority = false,
  fetchPriority,
  loading,
  decoding,
  sizes,
}: StaticPictureProps) {
  const isCritical = priority || fetchPriority === "high";
  const resolvedFetchPriority = priority ? "high" : fetchPriority;
  const resolvedLoading = priority ? "eager" : loading;
  const resolvedDecoding =
    decoding ?? (isCritical ? ("sync" as const) : ("async" as const));
  const blurStyle = src.blurDataURL
    ? {
        backgroundImage: `url(${src.blurDataURL})`,
        backgroundSize: "cover",
      }
    : undefined;

  const img = (
    <img
      src={src.webp}
      alt={decorative ? "" : alt}
      width={width}
      height={height}
      sizes={sizes}
      aria-hidden={decorative ? true : undefined}
      decoding={resolvedDecoding}
      fetchPriority={resolvedFetchPriority}
      loading={resolvedLoading}
      style={blurStyle}
      className={className}
    />
  );

  if (src.webp === src.fallback) {
    return (
      <span className={cn("inline-block shrink-0", pictureClassName)}>
        {img}
      </span>
    );
  }

  return (
    <picture className={cn("shrink-0", pictureClassName)}>
      <source srcSet={src.webp} type="image/webp" sizes={sizes} />
      <img
        src={src.fallback}
        alt={decorative ? "" : alt}
        width={width}
        height={height}
        sizes={sizes}
        aria-hidden={decorative ? true : undefined}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        loading={resolvedLoading}
        style={blurStyle}
        className={className}
      />
    </picture>
  );
}
