import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Center,
  Divider,
  Flex,
  Group,
  Paper,
  Progress,
  RingProgress,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBack,
  IconArrowLeft,
  IconBrain,
  IconBulb,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCrown,
  IconRocket,
  IconSchool,
  IconSearch,
  IconShield,
  IconSword,
  IconTarget,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import ChessExerciseBoardWithProvider from "./components/ChessExerciseBoard";
import { CompletionModal } from "./components/CompletionModal";
import { LinearProgress } from "./components/ProgressIndicator";
import { useExerciseState } from "./hooks/useExerciseState";
import { type ProgressData, useProgress } from "./hooks/useProgress";

interface PracticeExercise {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  fen: string;
  correctMoves: string[];
  points?: number;
  timeLimit?: number;
}

interface PracticeCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  exercises: PracticeExercise[];
  estimatedTime?: number;
}

const practiceCategories: PracticeCategory[] = [
  {
    id: "tactics",
    title: "Tactical Puzzles",
    description: "Sharpen your tactical vision with challenging puzzles",
    icon: <IconSword size={24} />,
    color: "red",
    estimatedTime: 20,
    exercises: [
      {
        id: "fork-1",
        title: "Knight Fork",
        description: "Find the knight fork to win material",
        difficulty: "beginner",
        points: 100,
        timeLimit: 60,
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1",
        correctMoves: ["f3e5"],
      },
      {
        id: "pin-1",
        title: "Pin Tactic",
        description: "Use the pin to win material",
        difficulty: "beginner",
        points: 150,
        timeLimit: 90,
        fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        correctMoves: ["c4f7"],
      },
      {
        id: "skewer-1",
        title: "Bishop Skewer",
        description: "Use the bishop to skewer the opponent's pieces",
        difficulty: "intermediate",
        points: 200,
        timeLimit: 120,
        fen: "r3k2r/ppp2ppp/2n1b3/2b1p3/4P3/2N2N2/PPPP1PPP/R1B1K2R w KQkq - 0 1",
        correctMoves: ["f3e5"],
      },
    ],
  },
  {
    id: "endgames",
    title: "Endgame Training",
    description: "Master essential endgame techniques and patterns",
    icon: <IconCrown size={24} />,
    color: "yellow",
    estimatedTime: 25,
    exercises: [
      {
        id: "king-pawn-1",
        title: "King and Pawn vs King",
        description: "Win with king and pawn against lone king",
        difficulty: "beginner",
        points: 100,
        timeLimit: 120,
        fen: "8/8/8/8/8/4k3/4P3/4K3 w - - 0 1",
        correctMoves: ["e1d2", "e1f2"],
      },
      {
        id: "rook-endgame-1",
        title: "Rook Endgame",
        description: "Find the winning move in this rook endgame",
        difficulty: "intermediate",
        points: 200,
        timeLimit: 180,
        fen: "8/8/8/8/8/2k5/2p5/2K1R3 w - - 0 1",
        correctMoves: ["e1e3"],
      },
      {
        id: "queen-vs-pawn",
        title: "Queen vs Pawn",
        description: "Stop the pawn from promoting",
        difficulty: "intermediate",
        points: 250,
        timeLimit: 150,
        fen: "8/8/8/8/8/8/1p6/1K1Q4 w - - 0 1",
        correctMoves: ["d1d2"],
      },
    ],
  },
  {
    id: "openings",
    title: "Opening Mastery",
    description: "Practice key opening positions and principles",
    icon: <IconRocket size={24} />,
    color: "blue",
    estimatedTime: 15,
    exercises: [
      {
        id: "italian-game",
        title: "Italian Game",
        description: "Find the best continuation in the Italian Game",
        difficulty: "beginner",
        points: 100,
        timeLimit: 90,
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
        correctMoves: ["f8c5"],
      },
      {
        id: "sicilian-defense",
        title: "Sicilian Defense",
        description: "Play the key move in the Sicilian Defense",
        difficulty: "intermediate",
        points: 150,
        timeLimit: 120,
        fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
        correctMoves: ["g1f3", "d2d4"],
      },
      {
        id: "queens-gambit",
        title: "Queen's Gambit",
        description: "Respond to the Queen's Gambit correctly",
        difficulty: "intermediate",
        points: 200,
        timeLimit: 150,
        fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2",
        correctMoves: ["e7e6", "c7c6", "d5c4"],
      },
    ],
  },
  {
    id: "strategy",
    title: "Strategic Training",
    description: "Develop your positional understanding and planning",
    icon: <IconBrain size={24} />,
    color: "purple",
    estimatedTime: 30,
    exercises: [
      {
        id: "outpost-1",
        title: "Knight Outpost",
        description: "Create and utilize a powerful knight outpost",
        difficulty: "intermediate",
        points: 200,
        timeLimit: 180,
        fen: "r1bqkb1r/pp1n1ppp/2p1pn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQK2R w KQkq - 0 1",
        correctMoves: ["f3e5"],
      },
      {
        id: "weak-squares",
        title: "Exploit Weak Squares",
        description: "Identify and exploit weak squares in the position",
        difficulty: "advanced",
        points: 300,
        timeLimit: 240,
        fen: "r1bqkb1r/pp3ppp/2p1pn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQK2R w KQkq - 0 1",
        correctMoves: ["c3b5"],
      },
    ],
  },
];

function CategoryCard({
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

function ModernExerciseCard({
  exercise,
  index,
  isCompleted,
  onClick,
}: {
  exercise: PracticeExercise;
  index: number;
  isCompleted: boolean;
  onClick: () => void;
}) {
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

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return <IconSchool size={16} />;
      case "intermediate":
        return <IconTarget size={16} />;
      case "advanced":
        return <IconRocket size={16} />;
      default:
        return <IconTarget size={16} />;
    }
  };

  return (
    <Card
      padding="md"
      radius="md"
      withBorder
      style={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: isCompleted ? 0.8 : 1,
      }}
      onClick={onClick}
    >
      <Group justify="space-between" align="center">
        <Group gap="md">
          <ThemeIcon
            size={40}
            radius="md"
            variant="light"
            color={isCompleted ? "green" : getDifficultyColor(exercise.difficulty)}
          >
            {isCompleted ? <IconCheck size={20} /> : <Text fw={700}>{index + 1}</Text>}
          </ThemeIcon>

          <Box>
            <Group gap="xs" mb="xs">
              <Text fw={600} size="sm">
                {exercise.title}
              </Text>
              <Badge
                size="xs"
                variant="light"
                color={getDifficultyColor(exercise.difficulty)}
                leftSection={getDifficultyIcon(exercise.difficulty)}
              >
                {exercise.difficulty}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" lineClamp={2}>
              {exercise.description}
            </Text>
          </Box>
        </Group>

        <Group gap="md">
          {exercise.points && (
            <Group gap="xs">
              <IconTrophy size={16} color="orange" />
              <Text size="sm" fw={500} c="orange">
                {exercise.points}
              </Text>
            </Group>
          )}
          {exercise.timeLimit && (
            <Group gap="xs">
              <IconClock size={16} />
              <Text size="sm" c="dimmed">
                {Math.floor(exercise.timeLimit / 60)}:{(exercise.timeLimit % 60).toString().padStart(2, "0")}
              </Text>
            </Group>
          )}
          <IconChevronRight size={16} />
        </Group>
      </Group>
    </Card>
  );
}

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("category");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedCategoryTitle, setCompletedCategoryTitle] = useState("");

  const calculateOverallProgress = (allProgress: Record<string, ProgressData>): number => {
    let totalExercises = 0;
    let completedExercises = 0;

    practiceCategories.forEach((category) => {
      totalExercises += category.exercises.length;
      const progress = allProgress[category.id] || { exercisesCompleted: [] };
      completedExercises += progress.exercisesCompleted.length;
    });

    return totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  };

  const {
    progress: practiceProgress,
    overallProgress,
    updateExerciseCompletion,
    loadAllProgress,
    resetAllProgress,
  } = useProgress({
    prefix: "practice",
    calculateOverallProgress,
  });

  const {
    selectedCategory,
    selectedExercise,
    currentFen,
    message,
    showHint,
    lastCorrectMove,
    showingCorrectAnimation,
    handleCategorySelect,
    handleExerciseSelect,
    handleMove: handleMoveBase,
    toggleHint,
    clearSelection,
  } = useExerciseState<PracticeExercise, PracticeCategory>({
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    onExerciseComplete: (categoryId, exerciseId) => {
      const category = practiceCategories.find((c) => c.id === categoryId);
      if (!category) return;

      updateExerciseCompletion(categoryId, exerciseId, category.exercises.length, (completedCategoryId) => {
        const completedCategory = practiceCategories.find((c) => c.id === completedCategoryId);
        if (completedCategory) {
          setCompletedCategoryTitle(completedCategory.title);
          setShowCompletionModal(true);
        }
      });

      if (selectedCategory && selectedExercise) {
        const currentIndex = selectedCategory.exercises.findIndex((ex) => ex.id === selectedExercise.id);
        if (currentIndex < selectedCategory.exercises.length - 1) {
          setTimeout(() => {
            const nextExercise = selectedCategory.exercises[currentIndex + 1];
            handleExerciseSelect(nextExercise);
          }, 1500);
        }
      }
    },
  });

  useEffect(() => {
    loadAllProgress(practiceCategories.map((category) => category.id));
  }, []);

  const handleMove = (orig: string, dest: string) => {
    if (!selectedExercise || !selectedCategory) return;
    handleMoveBase(orig, dest, selectedExercise.correctMoves);
  };

  const filteredCategories = practiceCategories.filter((category) => {
    const matchesSearch =
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalExercises = practiceCategories.reduce((sum, cat) => sum + cat.exercises.length, 0);
  const totalPoints = practiceCategories.reduce(
    (sum, cat) => sum + cat.exercises.reduce((catSum, ex) => catSum + (ex.points || 0), 0),
    0,
  );

  return (
    <>
      <CompletionModal
        opened={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title={completedCategoryTitle}
        onContinue={() => {
          setShowCompletionModal(false);
        }}
        onBackToList={() => {
          setShowCompletionModal(false);
          clearSelection();
        }}
      />

      <Stack gap="xl" p="md">
        {!selectedCategory ? (
          <>
            <Box>
              <Group justify="space-between" align="flex-start" mb="lg">
                <Box>
                  <Group gap="sm" mb="xs">
                    <ThemeIcon size={40} radius="md" variant="gradient" gradient={{ from: "orange", to: "red" }}>
                      <IconTarget size={24} />
                    </ThemeIcon>
                    <Title order={1} size="h2">
                      Practice Arena
                    </Title>
                  </Group>
                  <Text size="lg" c="dimmed">
                    Challenge yourself with tactical puzzles, endgame training, and strategic exercises
                  </Text>
                </Box>

                <Paper p="md" radius="md" withBorder>
                  <Center>
                    <RingProgress
                      size={100}
                      thickness={8}
                      roundCaps
                      sections={[{ value: overallProgress, color: "orange" }]}
                      label={
                        <Center>
                          <Stack align="center" gap={0}>
                            <Text fw={700} size="lg">
                              {Math.round(overallProgress)}%
                            </Text>
                            <Text size="xs" c="dimmed">
                              Complete
                            </Text>
                          </Stack>
                        </Center>
                      }
                    />
                  </Center>
                </Paper>
              </Group>

              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="lg">
                <Paper p="md" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="xs">
                      <ThemeIcon size={40} variant="light" color="blue">
                        <IconTarget size={20} />
                      </ThemeIcon>
                      <Text fw={700} size="xl">
                        {totalExercises}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Total Exercises
                      </Text>
                    </Stack>
                  </Center>
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="xs">
                      <ThemeIcon size={40} variant="light" color="yellow">
                        <IconTrophy size={20} />
                      </ThemeIcon>
                      <Text fw={700} size="xl">
                        {totalPoints.toLocaleString()}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Total Points
                      </Text>
                    </Stack>
                  </Center>
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="xs">
                      <ThemeIcon size={40} variant="light" color="green">
                        <IconShield size={20} />
                      </ThemeIcon>
                      <Text fw={700} size="xl">
                        {practiceCategories.length}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Categories
                      </Text>
                    </Stack>
                  </Center>
                </Paper>

                <Paper p="md" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="xs">
                      <ThemeIcon size={40} variant="light" color="red">
                        <IconRocket size={20} />
                      </ThemeIcon>
                      <Text fw={700} size="xl">
                        {Object.values(practiceProgress).reduce((sum, p) => sum + p.exercisesCompleted.length, 0)}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Completed
                      </Text>
                    </Stack>
                  </Center>
                </Paper>
              </SimpleGrid>

              <Group gap="md" mb="lg">
                <TextInput
                  placeholder="Search practice categories..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />

                <Select
                  placeholder="Sort by"
                  data={[
                    { value: "category", label: "Category" },
                    { value: "difficulty", label: "Difficulty" },
                    { value: "progress", label: "Progress" },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value || "category")}
                  w={150}
                />

                <Tooltip label="Reset all progress (for testing)">
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => resetAllProgress(practiceCategories.map((c) => c.id))}
                  >
                    <IconX size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Tabs value={activeTab} onChange={(value) => setActiveTab(value || "all")}>
                <Tabs.List>
                  <Tabs.Tab value="all">All Categories ({practiceCategories.length})</Tabs.Tab>
                  <Tabs.Tab value="beginner" leftSection={<IconSchool size={16} />}>
                    Beginner
                  </Tabs.Tab>
                  <Tabs.Tab value="intermediate" leftSection={<IconTarget size={16} />}>
                    Intermediate
                  </Tabs.Tab>
                  <Tabs.Tab value="advanced" leftSection={<IconRocket size={16} />}>
                    Advanced
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  progress={{
                    completed: practiceProgress[category.id]?.exercisesCompleted.length || 0,
                    total: category.exercises.length,
                  }}
                  onClick={() => handleCategorySelect(category)}
                />
              ))}
            </SimpleGrid>

            {filteredCategories.length === 0 && (
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center">
                    <ThemeIcon size={80} radius="md" variant="light" color="gray">
                      <IconSearch size={40} />
                    </ThemeIcon>
                    <Title order={3} c="dimmed">
                      No categories found
                    </Title>
                    <Text c="dimmed">Try adjusting your search criteria</Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </>
        ) : (
          <Flex gap="xl" align="flex-start">
            <Paper p="md" withBorder style={{ flex: 1 }}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group>
                    <ActionIcon variant="light" onClick={clearSelection} aria-label="Back to categories">
                      <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Breadcrumbs separator="→">
                      <Anchor component="button" onClick={clearSelection}>
                        Practice
                      </Anchor>
                      <Text>{selectedCategory.title}</Text>
                      {selectedExercise && <Text>{selectedExercise.title}</Text>}
                    </Breadcrumbs>
                  </Group>

                  {selectedExercise ? (
                    <Group>
                      <Tooltip label="Show hint">
                        <ActionIcon variant="light" color="yellow" onClick={toggleHint} disabled={showHint}>
                          <IconBulb size={20} />
                        </ActionIcon>
                      </Tooltip>
                      <Button
                        variant="subtle"
                        leftSection={<IconArrowBack size={16} />}
                        onClick={() => {
                          const currentCategoryIndex = practiceCategories.findIndex(
                            (c) => c.id === selectedCategory.id,
                          );
                          if (currentCategoryIndex >= 0) {
                            clearSelection();
                            handleCategorySelect(practiceCategories[currentCategoryIndex]);
                          }
                        }}
                      >
                        Back to Category
                      </Button>
                    </Group>
                  ) : (
                    <LinearProgress
                      completed={practiceProgress[selectedCategory.id]?.exercisesCompleted.length || 0}
                      total={selectedCategory.exercises.length}
                      size="sm"
                      width={200}
                    />
                  )}
                </Group>

                <Divider />

                {!selectedExercise ? (
                  <>
                    <Paper p="lg" withBorder radius="md">
                      <Group gap="md" mb="md">
                        <ThemeIcon size={40} variant="gradient" gradient={{ from: selectedCategory.color, to: "cyan" }}>
                          {selectedCategory.icon}
                        </ThemeIcon>
                        <Box>
                          <Title order={3}>{selectedCategory.title}</Title>
                          <Text c="dimmed">{selectedCategory.description}</Text>
                        </Box>
                      </Group>

                      <Group gap="lg">
                        <Group gap="xs">
                          <IconTarget size={16} />
                          <Text size="sm">{selectedCategory.exercises.length} exercises</Text>
                        </Group>
                        <Group gap="xs">
                          <IconClock size={16} />
                          <Text size="sm">{selectedCategory.estimatedTime} minutes</Text>
                        </Group>
                        <Group gap="xs">
                          <IconTrophy size={16} />
                          <Text size="sm">
                            {selectedCategory.exercises.reduce((sum, ex) => sum + (ex.points || 0), 0)} points
                          </Text>
                        </Group>
                      </Group>
                    </Paper>

                    <Title order={4}>Exercises ({selectedCategory.exercises.length})</Title>
                    <Stack gap="md">
                      {selectedCategory.exercises.map((exercise, index) => {
                        const isCompleted = practiceProgress[selectedCategory.id]?.exercisesCompleted.includes(
                          exercise.id,
                        );

                        return (
                          <ModernExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            index={index}
                            isCompleted={isCompleted}
                            onClick={() => handleExerciseSelect(exercise)}
                          />
                        );
                      })}
                    </Stack>
                  </>
                ) : (
                  <>
                    <Group justify="space-between" align="center">
                      <Title order={4}>{selectedExercise.title}</Title>
                      <Group gap="md">
                        {selectedExercise.points && (
                          <Badge color="orange" variant="light" size="lg">
                            <Group gap="xs">
                              <IconTrophy size={16} />
                              <Text>{selectedExercise.points} pts</Text>
                            </Group>
                          </Badge>
                        )}
                        {selectedExercise.timeLimit && (
                          <Badge color="blue" variant="light" size="lg">
                            <Group gap="xs">
                              <IconClock size={16} />
                              <Text>
                                {Math.floor(selectedExercise.timeLimit / 60)}:
                                {(selectedExercise.timeLimit % 60).toString().padStart(2, "0")}
                              </Text>
                            </Group>
                          </Badge>
                        )}
                      </Group>
                    </Group>

                    <Paper p="md" withBorder>
                      <Text>{selectedExercise.description}</Text>
                    </Paper>

                    {message && (
                      <Paper
                        p="md"
                        withBorder
                        bg={message.includes("Correct") ? "rgba(0,128,0,0.1)" : "rgba(255,0,0,0.1)"}
                      >
                        <Group>
                          {message.includes("Correct") ? (
                            <IconCheck size={20} color="green" />
                          ) : (
                            <IconX size={20} color="red" />
                          )}
                          <Text fw={500} c={message.includes("Correct") ? "green" : "red"}>
                            {message}
                          </Text>
                        </Group>
                      </Paper>
                    )}

                    {showHint && (
                      <Paper p="md" withBorder bg="rgba(255,223,0,0.1)">
                        <Group>
                          <IconBulb size={20} color="yellow" />
                          <Box>
                            <Text fw={500}>Hint</Text>
                            <Text>Look for the best move in this position. Consider all tactical motifs!</Text>
                          </Box>
                        </Group>
                      </Paper>
                    )}
                  </>
                )}
              </Stack>
            </Paper>

            <Box style={{ width: "500px" }}>
              <ChessExerciseBoardWithProvider
                fen={currentFen}
                onMove={handleMove}
                lastCorrectMove={lastCorrectMove}
                showingCorrectAnimation={showingCorrectAnimation}
                readOnly={!selectedExercise}
              />
            </Box>
          </Flex>
        )}
      </Stack>
    </>
  );
}
