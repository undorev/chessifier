import { Center, Progress, RingProgress, Tooltip } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  thickness?: number;
  tooltipLabel?: string;
}

export function CircularProgress({ completed, total, size = 40, thickness = 4, tooltipLabel }: CircularProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = percentage === 100;

  const defaultTooltip = `${completed}/${total} ${completed === 1 ? "item" : "items"} completed`;

  return (
    <Tooltip label={tooltipLabel || defaultTooltip}>
      <RingProgress
        size={size}
        thickness={thickness}
        roundCaps
        sections={[{ value: percentage, color: isComplete ? "green" : "blue" }]}
        label={
          isComplete ? (
            <Center>
              <IconCheck size={16} color="green" />
            </Center>
          ) : null
        }
      />
    </Tooltip>
  );
}

interface LinearProgressProps {
  completed: number;
  total: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  tooltipLabel?: string;
  width?: number;
}

export function LinearProgress({ completed, total, size = "md", tooltipLabel, width = 200 }: LinearProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = percentage === 100;

  const defaultTooltip = `${Math.round(percentage)}% complete`;

  return (
    <Tooltip label={tooltipLabel || defaultTooltip}>
      <Progress value={percentage} size={size} radius="xl" style={{ width }} color={isComplete ? "green" : "blue"} />
    </Tooltip>
  );
}
