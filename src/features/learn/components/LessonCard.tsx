import { Badge, Box, Button, Card, Group, Progress, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconBook, IconChevronRight, IconClock, IconRocket, IconSchool, IconTarget } from "@tabler/icons-react";
import type { Lesson } from "../LessonsPage";

export function LessonCard({
  lesson,
  progress,
  onClick,
}: {
  lesson: Lesson;
  progress: { completed: number; total: number };
  onClick: () => void;
}) {
  const completionPercentage = Math.round((progress.completed / progress.total) * 100);

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return <IconSchool size={20} />;
      case "intermediate":
        return <IconTarget size={20} />;
      case "advanced":
        return <IconRocket size={20} />;
      default:
        return <IconBook size={20} />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "green";
      case "intermediate":
        return "blue";
      case "advanced":
        return "red";
      default:
        return "gray";
    }
  };

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
          <ThemeIcon
            size={50}
            radius="md"
            variant="gradient"
            gradient={{ from: getDifficultyColor(lesson.difficulty), to: "cyan" }}
          >
            {getDifficultyIcon(lesson.difficulty)}
          </ThemeIcon>
          <Badge color={getDifficultyColor(lesson.difficulty)} variant="light" size="sm">
            {completionPercentage}%
          </Badge>
        </Group>

        <Box style={{ flex: 1 }}>
          <Text fw={600} size="lg" mb="xs">
            {lesson.title}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={3} mb="md">
            {lesson.description}
          </Text>

          {lesson.tags && (
            <Group gap="xs" mb="md">
              {lesson.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} size="xs" variant="outline" color="gray">
                  {tag}
                </Badge>
              ))}
            </Group>
          )}
        </Box>

        <Box>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconClock size={16} />
              <Text size="xs" c="dimmed">
                {lesson.estimatedTime || 15} min
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {progress.completed}/{progress.total} exercises
            </Text>
          </Group>

          <Progress
            value={completionPercentage}
            size="md"
            radius="xl"
            color={getDifficultyColor(lesson.difficulty)}
            mb="md"
          />

          <Button
            variant="light"
            color={getDifficultyColor(lesson.difficulty)}
            fullWidth
            radius="md"
            rightSection={<IconChevronRight size={16} />}
          >
            {progress.completed === 0 ? "Start Lesson" : "Continue"}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}
