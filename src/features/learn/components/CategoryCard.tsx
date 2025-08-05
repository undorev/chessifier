import { Badge, Box, Button, Card, Group, Progress, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconChevronRight, IconClock, IconTarget, IconTrophy } from "@tabler/icons-react";
import type { PracticeCategory } from "../PracticePage";

export function CategoryCard({
  category,
  progress,
  onClick,
}: {
  category: PracticeCategory;
  progress: { completed: number; total: number };
  onClick: () => void;
}) {
  const completionPercentage = Math.round((progress.completed / progress.total) * 100);
  const totalPoints = category.exercises.reduce((sum, ex) => sum + (ex.points || 0), 0);

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
      onClick={onClick}
    >
      <Stack gap="md" style={{ height: "100%" }}>
        <Group justify="space-between" align="flex-start">
          <ThemeIcon size={50} radius="md" variant="gradient" gradient={{ from: category.color, to: "cyan" }}>
            {category.icon}
          </ThemeIcon>
          <Badge color={category.color} variant="light" size="sm">
            {completionPercentage}%
          </Badge>
        </Group>

        <Box style={{ flex: 1 }}>
          <Text fw={600} size="lg" mb="xs">
            {category.title}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={3} mb="md">
            {category.description}
          </Text>

          <Group gap="lg" mb="md">
            <Group gap="xs">
              <IconTarget size={16} />
              <Text size="xs" c="dimmed">
                {category.exercises.length} exercises
              </Text>
            </Group>
            <Group gap="xs">
              <IconTrophy size={16} />
              <Text size="xs" c="dimmed">
                {totalPoints} pts
              </Text>
            </Group>
          </Group>
        </Box>

        <Box>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconClock size={16} />
              <Text size="xs" c="dimmed">
                {category.estimatedTime || 20} min
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {progress.completed}/{progress.total} completed
            </Text>
          </Group>

          <Progress value={completionPercentage} size="md" radius="xl" color={category.color} mb="md" />

          <Button
            variant="light"
            color={category.color}
            fullWidth
            radius="md"
            rightSection={<IconChevronRight size={16} />}
          >
            {progress.completed === 0 ? "Start Training" : "Continue"}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}
