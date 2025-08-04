import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconBook,
  IconBrain,
  IconChartLine,
  IconChevronRight,
  IconPlayerPlay,
  IconStar,
  IconTargetArrow,
  IconTrophy,
} from "@tabler/icons-react";
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

  const quickStats = [
    {
      label: "Current Streak",
      value: userStats.currentStreak,
      icon: <IconStar size={20} />,
      color: "orange",
      suffix: " days",
    },
    {
      label: "Total Points",
      value: userStats.totalPoints,
      icon: <IconTrophy size={20} />,
      color: "yellow",
      suffix: " pts",
    },
    {
      label: "Skill Level",
      value: "Beginner",
      icon: <IconBrain size={20} />,
      color: "purple",
      suffix: "",
    },
  ];

  const overallProgress = Math.round(
    ((userStats.lessonsCompleted + userStats.practiceCompleted) / (userStats.totalLessons + userStats.totalPractice)) *
      100,
  );

  return (
    <Stack gap="xl" p="md">
      <Box>
        <Group justify="space-between" align="flex-start" mb="md">
          <Box>
            <Title order={1} size="h2" mb="xs">
              Learn Chess
            </Title>
            <Text size="lg" c="dimmed">
              Master the royal game with structured lessons and practice
            </Text>
          </Box>
        </Group>
      </Box>

      <Paper p="lg" radius="md" withBorder>
        <Group justify="space-between" align="center" mb="md">
          <Text fw={600} size="lg">
            Your Progress
          </Text>
          <Badge size="lg" variant="light" color="blue">
            {overallProgress}% Complete
          </Badge>
        </Group>

        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Center>
              <RingProgress
                size={120}
                thickness={12}
                roundCaps
                sections={[
                  { value: (userStats.lessonsCompleted / userStats.totalLessons) * 100, color: "blue" },
                  { value: (userStats.practiceCompleted / userStats.totalPractice) * 100, color: "green" },
                ]}
                label={
                  <Center>
                    <Stack align="center" gap={0}>
                      <Text fw={700} size="xl">
                        {overallProgress}%
                      </Text>
                      <Text size="xs" c="dimmed">
                        Overall
                      </Text>
                    </Stack>
                  </Center>
                }
              />
            </Center>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              {quickStats.map((stat) => (
                <Group key={stat.label} justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon color={stat.color} variant="light" size="sm">
                      {stat.icon}
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">
                      {stat.label}
                    </Text>
                  </Group>
                  <Text fw={600}>
                    {stat.value}
                    {stat.suffix}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>

      <Box>
        <Title order={3} mb="md">
          Choose Your Path
        </Title>
        <Grid>
          {learningPaths.map((path) => (
            <Grid.Col key={path.id} span={{ base: 12, sm: 6 }}>
              <Card
                shadow="sm"
                p="lg"
                radius="md"
                withBorder
                style={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onClick={path.onClick}
              >
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

                    <Button
                      variant="light"
                      color={path.color}
                      fullWidth
                      radius="md"
                      rightSection={<IconChevronRight size={16} />}
                    >
                      {path.label}
                    </Button>
                  </Box>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Box>

      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={600} mb={4}>
              Ready to continue?
            </Text>
            <Text size="sm" c="dimmed">
              Pick up where you left off
            </Text>
          </Box>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={() => navigate({ to: "/learn/lessons" })}
            >
              Continue Learning
            </Button>
            <Button leftSection={<IconChartLine size={16} />} onClick={() => navigate({ to: "/learn/practice" })}>
              Start Practice
            </Button>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
