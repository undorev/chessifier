import { Badge, Box, Button, Card, Grid, Group, Progress, Stack, Text, ThemeIcon, Title, Tooltip } from "@mantine/core";
import { IconBook, IconStar, IconTargetArrow, IconTrophy } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export default function LearnPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const userStats = {
    lessonsCompleted: 12,
    totalLessons: 30,
    practiceCompleted: 25,
    totalPractice: 50,
    currentStreak: 7,
    totalPoints: 1250,
  };

  const learningPaths = [
    {
      id: "lessons",
      icon: <IconBook size={32} />,
      title: t("Lessons.Title"),
      description: t("Home.Card.Learn.Desc"),
      label: t("Lessons.StartLesson"),
      progress: { completed: userStats.lessonsCompleted, total: userStats.totalLessons },
      color: "blue",
      gradient: { from: "blue", to: "cyan" },
      onClick: () => navigate({ to: "/learn/lessons" }),
    },
    {
      id: "practice",
      icon: <IconTargetArrow size={32} />,
      title: t("Practice.Title"),
      description: t("Practice.Description"),
      label: t("Practice.Start"),
      progress: { completed: userStats.practiceCompleted, total: userStats.totalPractice },
      color: "green",
      gradient: { from: "green", to: "lime" },
      onClick: () => navigate({ to: "/learn/practice" }),
    },
  ];

  return (
    <Stack gap="xl" p="md">
      <Box>
        <Group justify="space-between" align="flex-start" mb="md">
          <Box>
            <Title mb="xs">Chess Mastery Hub</Title>
            <Text size="lg" c="dimmed">
              Your central hub to learn, practice, and master chess step by step
            </Text>
          </Box>
        </Group>
      </Box>

      <Box>
        <Title order={2} mb="md">
          Your Progress
        </Title>
        <Grid mb="md" gutter="md">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card p="md" radius="md" withBorder h="105px">
              <Group gap="sm">
                <ThemeIcon color="gray" variant="light" size="lg">
                  <IconTrophy size={20} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                  Overall Progress
                </Text>
              </Group>
              <Progress.Root mt="lg" radius="xl" size="md">
                <Tooltip
                  label={`${Math.round(
                    ((userStats.lessonsCompleted / userStats.totalLessons +
                      userStats.practiceCompleted / userStats.totalPractice) /
                      2) *
                      100,
                  )}%`}
                >
                  <Progress.Section
                    value={
                      ((userStats.lessonsCompleted / userStats.totalLessons +
                        userStats.practiceCompleted / userStats.totalPractice) /
                        2) *
                      100
                    }
                  />
                </Tooltip>
              </Progress.Root>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card p="md" radius="md" withBorder h="105px">
              <Group gap="sm">
                <ThemeIcon color="gray" variant="light" size="lg">
                  <IconStar size={20} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                  Skill Level
                </Text>
              </Group>
              <Text fw={600} size="lg" mt="xs">
                {(() => {
                  const percent =
                    ((userStats.lessonsCompleted / userStats.totalLessons +
                      userStats.practiceCompleted / userStats.totalPractice) /
                      2) *
                    100;
                  if (percent >= 90) return "Master";
                  if (percent >= 70) return "Advanced";
                  if (percent >= 40) return "Intermediate";
                  return "Beginner";
                })()}
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card p="md" radius="md" withBorder h="105px">
              <Group gap="sm">
                <ThemeIcon color="gray" variant="light" size="lg">
                  <IconStar size={20} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                  Streak
                </Text>
              </Group>
              <Text fw={600} size="lg" mt="xs">
                {userStats.currentStreak} days
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card p="md" radius="md" withBorder h="105px">
              <Group gap="sm">
                <ThemeIcon color="gray" variant="light" size="lg">
                  <IconTrophy size={20} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                  Points
                </Text>
              </Group>
              <Text fw={600} size="lg" mt="xs">
                {userStats.totalPoints} pts
              </Text>
            </Card>
          </Grid.Col>
        </Grid>
      </Box>

      <Box>
        <Title order={3} mb="md">
          Learning Modules
        </Title>
        <Grid>
          {learningPaths.map((path) => (
            <Grid.Col key={path.id} span={{ base: 12, sm: 6 }}>
              <Card shadow="sm" p="lg" radius="md" withBorder onClick={path.onClick}>
                <Stack gap="md" h="100%">
                  <Group justify="space-between" align="flex-start">
                    <ThemeIcon size={60} radius="md" variant="gradient" gradient={path.gradient}>
                      {path.icon}
                    </ThemeIcon>
                    <Badge color={path.color} variant="light">
                      {Math.round((path.progress.completed / path.progress.total) * 100)}%
                    </Badge>
                  </Group>

                  <Box style={{ flex: 1 }}>
                    <Text fw={600} size="xl" mb="xs">
                      {path.title}
                    </Text>
                    <Text size="sm" c="dimmed" lineClamp={3}>
                      {path.description}
                    </Text>
                  </Box>

                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={500}>
                        Progress
                      </Text>
                      <Text size="sm" c="dimmed">
                        {path.progress.completed}/{path.progress.total}
                      </Text>
                    </Group>
                    <Progress
                      value={(path.progress.completed / path.progress.total) * 100}
                      size="md"
                      radius="xl"
                      color={path.color}
                      style={{ marginBottom: 16 }}
                    />

                    <Button variant="light" color={path.color} fullWidth radius="md">
                      {path.label}
                    </Button>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
