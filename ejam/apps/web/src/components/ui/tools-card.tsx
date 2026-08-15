import Image from "next/image";
import type * as React from "react";
import {
  homeCardPillDisabledClass,
  homeCardPillStaticClass,
} from "@/lib/pressable";
import { cn } from "@/lib/utils";

export interface ToolCardItem {
  name?: string;
  description?: string;
  href?: string;
  img?: string;
  imgLight?: string;
  imgClassName?: string;
  mobileImgClassName?: string;
  imgWidth?: number;
  containerClassName?: string;
  cardClassName?: string;
  cardStyle?: React.CSSProperties;
  fadeBottom?: boolean;
  soon?: boolean;
  pill?: {
    label: string;
    iconSrc: string;
  };
  breadcrumb?: string;
}

export interface ToolCardGridProps {
  items: ToolCardItem[];
  className?: string;
  compact?: boolean;
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode;
  renderPillLink?: (href: string, children: React.ReactNode) => React.ReactNode;
}

function ToolCard({
  item,
  renderLink,
  renderPillLink,
  compact,
}: {
  item: ToolCardItem;
  renderLink?: ToolCardGridProps["renderLink"];
  renderPillLink?: ToolCardGridProps["renderPillLink"];
  compact?: boolean;
}) {
  const pillOnlyLink = Boolean(
    compact && item.pill && item.href && renderPillLink,
  );

  const inner = (
    <div
      className={cn(
        "relative flex w-full flex-col",
        item.soon ? "cursor-not-allowed opacity-80" : "",
        !pillOnlyLink && item.href ? "cursor-pointer" : "",
      )}
    >
      <div
        style={item.cardStyle}
        className={cn(
          compact
            ? "relative flex h-36 w-full flex-col overflow-hidden rounded-lg border sm:h-40"
            : "relative flex h-80 w-full flex-col overflow-hidden rounded-3xl border md:h-96",
          item.cardClassName ?? "bg-card",
          item.soon ? "border-dashed border-border" : "border-border",
        )}
      >
        {item.soon && (
          <span className="absolute top-3 right-3 z-10 rounded-full border bg-card px-2 py-1 text-xs text-muted-foreground">
            Coming soon
          </span>
        )}

        {compact ? (
          <>
            {item.name || item.breadcrumb ? (
              <div className="relative z-10 shrink-0 px-2.5 pt-2.5 pb-1">
                <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-1">
                  {item.name ? (
                    <span
                      className={cn(
                        "font-instrument-sans text-[11px] font-medium leading-tight tracking-tight sm:min-w-0 sm:truncate sm:text-sm",
                        item.soon
                          ? "text-muted-foreground/80"
                          : "text-foreground",
                      )}
                    >
                      {item.name}
                    </span>
                  ) : null}
                  {item.breadcrumb ? (
                    <span className="font-instrument-sans text-[10px] leading-tight text-muted-foreground sm:shrink-0 sm:text-right sm:text-[11px]">
                      {item.breadcrumb}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {item.img || item.pill ? (
              <div className="relative mt-auto flex min-h-0 flex-1 flex-col">
                {item.img ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-end justify-start pl-0.5 sm:flex md:pl-1">
                    <img
                      src={item.img}
                      alt=""
                      width={item.imgWidth ?? 200}
                      height={140}
                      className={cn(
                        "block h-auto w-[75%] max-w-[6.5rem] object-contain object-bottom sm:max-w-[7.25rem]",
                        item.imgClassName,
                      )}
                    />
                  </div>
                ) : null}

                {item.img ? (
                  <div className="pointer-events-none absolute bottom-0 left-2.5 z-0 sm:hidden">
                    <img
                      src={item.img}
                      alt=""
                      width={item.imgWidth ?? 200}
                      height={140}
                      className={cn(
                        "block h-[4rem] w-auto max-w-[4.25rem] object-contain object-bottom object-left",
                        item.mobileImgClassName,
                      )}
                    />
                  </div>
                ) : null}

                <div
                  className={cn(
                    "relative z-10 mt-auto flex items-end justify-end gap-1.5 px-2.5 pb-2.5 pt-2 sm:gap-2",
                  )}
                >
                  {item.pill
                    ? (() => {
                        const pillContent = (
                          <>
                            <Image
                              src={item.pill.iconSrc}
                              alt=""
                              width={14}
                              height={14}
                              aria-hidden
                              className="size-2.5 shrink-0 sm:size-3"
                            />
                            {item.pill.label}
                          </>
                        );
                        if (pillOnlyLink && item.href && renderPillLink) {
                          return renderPillLink(item.href, pillContent);
                        }
                        const pillDisabled = !item.href;
                        return (
                          <span
                            className={cn(
                              pillDisabled
                                ? homeCardPillDisabledClass
                                : homeCardPillStaticClass,
                            )}
                            aria-disabled={pillDisabled || undefined}
                          >
                            {pillContent}
                          </span>
                        );
                      })()
                    : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div
            className={cn(
              "relative flex flex-1 flex-col gap-3 px-5 pt-6 pb-4",
              item.containerClassName,
            )}
          >
            {item.name || item.breadcrumb ? (
              <div className="relative z-10 flex flex-col items-start gap-0.5">
                {item.name ? (
                  <span
                    className={cn(
                      "shrink-0 font-instrument-sans text-xl font-medium leading-tight tracking-tight",
                      item.soon
                        ? "text-muted-foreground/80"
                        : "text-foreground",
                    )}
                  >
                    {item.name}
                  </span>
                ) : null}
              </div>
            ) : null}

            {!compact && item.img && (
              <img
                src={item.img}
                alt=""
                width={item.imgWidth ?? 200}
                height={200}
                className={cn(
                  "hidden h-auto outline outline-1 -outline-offset-1 outline-white/10 dark:block",
                  item.imgClassName,
                )}
              />
            )}
            {!compact && (item.imgLight ?? item.img) && (
              <img
                src={item.imgLight ?? item.img}
                alt=""
                width={item.imgWidth ?? 200}
                height={200}
                className={cn(
                  "h-auto outline outline-1 -outline-offset-1 outline-black/10 dark:hidden",
                  item.imgClassName,
                )}
              />
            )}

            {item.fadeBottom && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-22 bg-gradient-to-t from-card to-transparent" />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (item.href && renderLink && !pillOnlyLink) {
    return renderLink(item.href, inner);
  }

  return inner;
}

function ToolCardGrid({
  items,
  className,
  compact,
  renderLink,
  renderPillLink,
}: ToolCardGridProps) {
  return (
    <div className={cn("grid w-full grid-cols-1 gap-4", className)}>
      {items.map((item, index) => (
        <ToolCard
          key={item.name ?? `tool-card-${index}`}
          item={item}
          compact={compact}
          renderLink={renderLink}
          renderPillLink={renderPillLink}
        />
      ))}
    </div>
  );
}

export { ToolCardGrid };
