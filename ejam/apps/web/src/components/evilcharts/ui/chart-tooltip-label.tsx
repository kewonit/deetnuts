import * as React from "react";
import type { DefaultTooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { ChartConfig } from "@/components/evilcharts/ui/chart-types";
import { getPayloadConfigFromPayload } from "@/components/evilcharts/ui/chart-utils";
import { cn } from "@/lib/utils";

type TooltipPayload = NonNullable<
  DefaultTooltipContentProps<ValueType, NameType>["payload"]
>;

type ChartTooltipLabelProps = {
  config: ChartConfig;
  hideLabel: boolean;
  payload: TooltipPayload;
  label?: DefaultTooltipContentProps<ValueType, NameType>["label"];
  labelFormatter?: DefaultTooltipContentProps<
    ValueType,
    NameType
  >["labelFormatter"];
  labelClassName?: string;
  labelKey?: string;
};

export const ChartTooltipLabel = React.memo(function ChartTooltipLabel({
  config,
  hideLabel,
  payload,
  label,
  labelFormatter,
  labelClassName,
  labelKey,
}: ChartTooltipLabelProps) {
  if (hideLabel || !payload.length) {
    return null;
  }

  const [item] = payload;
  const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const value =
    !labelKey && typeof label === "string"
      ? (config[label]?.label ?? label)
      : itemConfig?.label;

  if (labelFormatter) {
    return (
      <div className={cn("font-medium", labelClassName)}>
        {labelFormatter(value, payload)}
      </div>
    );
  }

  if (!value) {
    return null;
  }

  return <div className={cn("font-medium", labelClassName)}>{value}</div>;
});
