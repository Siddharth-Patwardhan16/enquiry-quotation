"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

// Chart configuration type
type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  );
};

// Chart components
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config: _config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <div
      ref={ref}
      data-slot="chart"
      data-chart={chartId}
      className={`[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden ${className ?? ""}`}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
});
ChartContainer.displayName = "Chart";

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: Array<{
      dataKey?: string;
      name?: string;
      value?: number;
      payload?: Record<string, unknown>;
      color?: string;
    }>;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    label?: string;
    labelFormatter?: (_value: unknown, _payload: unknown) => React.ReactNode;
    labelClassName?: string;
    formatter?: (_value: unknown, _name: unknown, _item: unknown, _index: number, _payload: unknown) => React.ReactNode;
    color?: string;
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey: _nameKey,
      labelKey: _labelKey,
    },
    ref,
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (!active || !payload?.length || hideLabel) {
        return null;
      }

      const [item] = payload;
      const value = typeof label === "string" ? label : item?.name;

      if (labelFormatter) {
        return (
          <div className={`font-medium ${labelClassName ?? ""}`}>
            {labelFormatter(value, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={`font-medium ${labelClassName ?? ""}`}>{value}</div>;
    }, [active, payload, hideLabel, label, labelFormatter, labelClassName]);

    const tooltipContent = React.useMemo(() => {
      if (!active || !payload?.length || hideIndicator) {
        return null;
      }

      return payload.map((item, _index) => {
        const indicatorColor = color ?? item?.color;

        return (
          <div
            key={item.dataKey}
            className={`flex w-full flex-col gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-sm ${className ?? ""}`}
          >
            <div className="flex w-full flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {indicator === "dot" ? (
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: indicatorColor,
                    }}
                  />
                ) : indicator === "dashed" ? (
                  <div
                    className="h-0 w-3 shrink-0 border-t-2"
                    style={{
                      borderColor: indicatorColor,
                    }}
                  />
                ) : (
                  <div
                    className="h-0 w-3 shrink-0 border-t-2"
                    style={{
                      borderColor: indicatorColor,
                    }}
                  />
                )}
                <div className="flex w-full justify-between">
                  <div className="grid gap-1.5">
                    <div className="text-muted-foreground">
                      {item.name}
                    </div>
                    {formatter ? (
                      formatter(item.value, item.name, item, _index, item.payload)
                    ) : (
                      <div className="font-medium tabular-nums text-foreground">
                        {item.value}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      });
    }, [
      active,
      payload,
      hideIndicator,
      indicator,
      color,
      formatter,
      className,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    if (!tooltipLabel && !tooltipContent) {
      return null;
    }

    return (
      <div ref={ref} className="grid w-full gap-1.5">
        {tooltipLabel}
        {tooltipContent}
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    hideIcon?: boolean;
    nameKey?: string;
    payload?: Array<{
      value?: string;
      type?: string;
      color?: string;
      payload?: Record<string, unknown>;
    }>;
  }
>(({ className, hideIcon = false, nameKey: _nameKey, payload }, ref) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={`flex items-center justify-center gap-4 text-xs ${className ?? ""}`}
    >
      {payload.map((item, _index) => {
        return (
          <div
            key={item.value}
            className={`flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground`}
          >
            {!hideIcon && (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {item.value}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
};