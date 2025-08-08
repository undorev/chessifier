import { AreaChart } from "@mantine/charts";
import type { MantineColor } from "@mantine/core";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Image,
  Progress,
  RingProgress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowRight,
  IconBolt,
  IconBook2,
  IconBrain,
  IconChartLine,
  IconChess,
  IconClock,
  IconFlame,
  IconPuzzle,
  IconStopwatch,
  IconTrophy,
  IconUpload,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { activeTabAtom, tabsAtom } from "@/state/atoms";
import { type GameRecord, getRecentGames } from "@/utils/gameRecords";
import { genID, type Tab } from "@/utils/tabs";

export default function DashboardPage() {
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  useEffect(() => {
    const key = "pawn-appetit.firstOpen";
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "true");
      setIsFirstOpen(true);
    } else {
      setIsFirstOpen(false);
    }
  }, []);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [_tabs, setTabs] = useAtom(tabsAtom);
  const [_activeTab, setActiveTab] = useAtom(activeTabAtom);

  const user = {
    name: "John Doe",
    handle: "@grossmeister",
    rating: 2700,
    title: "GrossMeister",
  };

  const ratingHistory = [
    { day: "Mon", rating: 2700 },
    { day: "Tue", rating: 2700 },
    { day: "Wed", rating: 2700 },
    { day: "Thu", rating: 2700 },
    { day: "Fri", rating: 2700 },
    { day: "Sat", rating: 2700 },
    { day: "Sun", rating: 2700 },
  ];

  const [recentGames, setRecentGames] = useState<GameRecord[]>([]);
  useEffect(() => {
    getRecentGames(10).then(setRecentGames);
  }, []);

  const puzzleStats = {
    currentStreak: 7,
    target: 30,
    history: [
      { day: "Mon", solved: 3 },
      { day: "Tue", solved: 2 },
      { day: "Wed", solved: 4 },
      { day: "Thu", solved: 1 },
      { day: "Fri", solved: 5 },
      { day: "Sat", solved: 2 },
      { day: "Sun", solved: 3 },
    ],
  };

  const suggestions = [
    { id: "l1", title: "Blunder Check: Hanging Pieces", tag: "Tactics", difficulty: "Beginner" },
    { id: "l2", title: "Endgame Basics: King & Pawn", tag: "Endgames", difficulty: "Intermediate" },
    { id: "l3", title: "Opening Explorer: Queen's Gambit", tag: "Openings", difficulty: "All" },
  ];

  const goals = [
    { id: "g", label: "Play 2 games", current: 1, total: 2 },
    { id: "p", label: "Solve 10 puzzles", current: 6, total: 10 },
    { id: "l", label: "Finish 1 lesson", current: 0, total: 1 },
  ];

  const PLAY_CHESS = {
    icon: <IconChess size={50} />,
    title: t("Dashboard.Card.PlayChess.Title"),
    description: t("Dashboard.Card.PlayChess.Desc"),
    label: t("Dashboard.Card.PlayChess.Button"),
    onClick: () => {
      const uuid = genID();
      setTabs((prev: Tab[]) => {
        return [
          ...prev,
          {
            value: uuid,
            name: "New Game",
            type: "play",
          },
        ];
      });
      setActiveTab(uuid);
      navigate({ to: "/boards" });
    },
  };

  const quickActions: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    color: MantineColor;
  }[] = [
    {
      icon: <IconClock />,
      title: "Classical",
      description: "Play classical chess games",
      onClick: () => navigate({ to: "/boards" }),
      color: "blue",
    },
    {
      icon: <IconStopwatch />,
      title: "Rapid",
      description: "Engage in rapid chess matches",
      onClick: () => navigate({ to: "/boards" }),
      color: "green",
    },
    {
      icon: <IconBolt />,
      title: "Blitz",
      description: "Play fast-paced blitz games",
      onClick: () => navigate({ to: "/boards" }),
      color: "red",
    },
  ];

  return (
    <Stack p="md" gap="md">
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group align="center" justify="space-between" wrap="nowrap">
          <Stack gap={6} flex={6}>
            <Title order={1} fw={800}>
              {isFirstOpen ? "Welcome to Pawn Appétit!" : " Welcome back"}
            </Title>
            <Text size="sm" c="dimmed">
              Ready to make your next best move?
            </Text>
            <Group gap="xs" mt="xs">
              <Button radius="md" onClick={PLAY_CHESS.onClick} leftSection={<IconChess size={18} />}>
                Play a game
              </Button>
              <Button
                variant="light"
                radius="md"
                onClick={() => navigate({ to: "/boards" })}
                leftSection={<IconUpload size={18} />}
              >
                Upload PGN
              </Button>
            </Group>
          </Stack>
          <Box flex={4}>
            <Image src="/chess-play.jpg" alt="Chess play" radius="lg" />
          </Box>
        </Group>
      </Card>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="lg" radius="md" h="100%">
            <Group>
              <Avatar size={56} radius="xl" src={undefined}>
                {user.name[0]}
              </Avatar>
              <Box>
                <Group gap={6}>
                  <Text fw={700}>{user.name}</Text>
                  <Badge color="yellow" variant="light">
                    {user.title}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {user.handle}
                </Text>
              </Box>
            </Group>
            <Divider my="md" />
            <Group align="flex-end" justify="space-between">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Rating
                </Text>
                <Text fw={700} fz="xl">
                  {user.rating}
                </Text>
              </Stack>
              <ThemeIcon color="teal" variant="light" size={36}>
                <IconChartLine size={18} />
              </ThemeIcon>
            </Group>
            <Box mt="sm">
              <AreaChart
                h={120}
                data={ratingHistory}
                dataKey="day"
                series={[{ name: "rating", color: "teal.6" }]}
                withLegend={false}
                curveType="monotone"
                gridAxis="none"
                xAxisProps={{ hide: true }}
                yAxisProps={{ hide: true }}
                strokeWidth={2}
                fillOpacity={0.25}
              />
            </Box>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p="lg" radius="md" h="100%">
            <Group justify="space-between" mb="md">
              <Text fw={700}>Quick actions</Text>
              <Text size="sm" c="dimmed">
                Jump in with one click
              </Text>
            </Group>
            <SimpleGrid cols={{ base: 3, sm: 3, lg: 3 }}>
              {quickActions.map((qa) => (
                <Card key={qa.title} withBorder radius="md" p="md">
                  <Stack gap={8} align="flex-start">
                    <ThemeIcon variant="light" color={qa.color} size={42} radius="md">
                      {qa.icon}
                    </ThemeIcon>
                    <Text fw={600}>{qa.title}</Text>
                    <Text size="sm" c="dimmed">
                      {qa.description}
                    </Text>
                    <Button variant="light" rightSection={<IconArrowRight size={16} />} onClick={qa.onClick}>
                      Open
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder p="lg" radius="md" h="100%">
            <Group justify="space-between" mb="sm">
              <Text fw={700}>Recent games</Text>
            </Group>
            <ScrollArea h={240} type="auto">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Opponent</Table.Th>
                    <Table.Th>Color</Table.Th>
                    <Table.Th>Result</Table.Th>
                    <Table.Th>Accuracy</Table.Th>
                    <Table.Th>Moves</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentGames.map((g) => {
                    const isUserWhite = g.white.type === "human";
                    const opponent = isUserWhite ? g.black : g.white;
                    const color = isUserWhite ? "White" : "Black";
                    const now = Date.now();
                    const diffMs = now - g.timestamp;
                    let dateStr = "";
                    if (diffMs < 60 * 60 * 1000) {
                      dateStr = `${Math.floor(diffMs / (60 * 1000))}m ago`;
                    } else if (diffMs < 24 * 60 * 60 * 1000) {
                      dateStr = `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`;
                    } else {
                      dateStr = `${Math.floor(diffMs / (24 * 60 * 60 * 1000))}d ago`;
                    }
                    return (
                      <Table.Tr key={g.id}>
                        <Table.Td>
                          <Group gap="xs">
                            <Avatar size={24} radius="xl">
                              {(opponent.name ?? "?")[0]?.toUpperCase()}
                            </Avatar>
                            <Text>{opponent.name ?? (opponent.engine ? `Engine (${opponent.engine})` : "?")}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">{color}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={g.result === "1-0" ? "teal" : g.result === "0-1" ? "red" : "gray"}>
                            {g.result === "1-0" ? "Win" : g.result === "0-1" ? "Loss" : g.result}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            -
                          </Text>
                        </Table.Td>
                        <Table.Td>{g.moves.length}</Table.Td>
                        <Table.Td c="dimmed">{dateStr}</Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            variant="light"
                            onClick={() => {
                              const uuid = genID();
                              setTabs((prev: Tab[]) => [...prev, { value: uuid, name: "Analyze", type: "analysis" }]);
                              setActiveTab(uuid);
                              navigate({ to: "/boards" });
                            }}
                          >
                            Analyze
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder p="lg" radius="md" h="100%">
            <Group justify="space-between" mb="sm">
              <Text fw={700}>Puzzles</Text>
              <Button size="xs" variant="light" onClick={() => navigate({ to: "/boards" })} leftSection={<IconPuzzle size={16} />}>
                Solve now
              </Button>
            </Group>
            <Group align="center" gap="lg">
              <RingProgress
                size={180}
                thickness={12}
                sections={[{ value: (puzzleStats.currentStreak / puzzleStats.target) * 100, color: "yellow" }]}
                label={
                  <Stack gap={0} align="center">
                    <ThemeIcon color="yellow" variant="light">
                      <IconFlame size={18} />
                    </ThemeIcon>
                    <Text fw={700}>{puzzleStats.currentStreak}</Text>
                    <Text size="xs" c="dimmed">
                      day streak
                    </Text>
                  </Stack>
                }
              />
              <Box style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" mb={6}>
                  This week
                </Text>
                <AreaChart
                  h={120}
                  data={puzzleStats.history}
                  dataKey="day"
                  series={[{ name: "solved", color: "yellow.6" }]}
                  withLegend={false}
                  curveType="monotone"
                  gridAxis="none"
                  xAxisProps={{ hide: true }}
                  yAxisProps={{ hide: true }}
                  strokeWidth={2}
                  fillOpacity={0.25}
                />
              </Box>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder p="lg" radius="md" h="100%">
            <Group justify="space-between" mb="sm">
              <Text fw={700}>Suggested for you</Text>
              <Group gap="xs">
                <Badge variant="light" color="grape">
                  Lessons
                </Badge>
                <Badge variant="light" color="blue">
                  Openings
                </Badge>
              </Group>
            </Group>
            <Stack>
              {suggestions.map((s) => (
                <Group key={s.id} justify="space-between" align="center">
                  <Group>
                    <ThemeIcon
                      variant="light"
                      color={s.tag === "Openings" ? "blue" : s.tag === "Endgames" ? "grape" : "teal"}
                    >
                      {s.tag === "Openings" ? (
                        <IconBook2 size={16} />
                      ) : s.tag === "Endgames" ? (
                        <IconBrain size={16} />
                      ) : (
                        <IconTrophy size={16} />
                      )}
                    </ThemeIcon>
                    <Stack gap={0}>
                      <Text fw={600}>{s.title}</Text>
                      <Group gap={6}>
                        <Badge variant="light">{s.tag}</Badge>
                        <Badge variant="dot" color="gray">
                          {s.difficulty}
                        </Badge>
                      </Group>
                    </Stack>
                  </Group>
                  <Button
                    variant="light"
                    onClick={() => navigate({ to: "/learn" })}
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Start
                  </Button>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder p="lg" radius="md" h="100%">
            <Group justify="space-between" mb="sm">
              <Text fw={700}>Daily goals</Text>
              <ThemeIcon variant="light" color="teal">
                <IconTrophy size={16} />
              </ThemeIcon>
            </Group>
            <Stack>
              {goals.map((g) => {
                const value = Math.round((g.current / g.total) * 100);
                return (
                  <Box key={g.id}>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm">{g.label}</Text>
                      <Text size="xs" c="dimmed">
                        {g.current}/{g.total}
                      </Text>
                    </Group>
                    <Progress value={value} color={value >= 100 ? "teal" : value > 60 ? "yellow" : "green"} />
                  </Box>
                );
              })}
            </Stack>
            <Divider my="md" />
            <Group>
              <Badge color="yellow" variant="light" leftSection={<IconFlame size={14} />}>
                Streak {puzzleStats.currentStreak}
              </Badge>
              <Badge color="teal" variant="light" leftSection={<IconTrophy size={14} />}>
                Achievement: Tactician
              </Badge>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
