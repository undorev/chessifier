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
  IconBook,
  IconBulb,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconRocket,
  IconSchool,
  IconSearch,
  IconTarget,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

import ChessExerciseBoardWithProvider from "./components/ChessExerciseBoard";
import { CompletionModal } from "./components/CompletionModal";
import { ExerciseCard } from "./components/ExerciseCard";
import { LinearProgress } from "./components/ProgressIndicator";
import { useExerciseState } from "./hooks/useExerciseState";
import { type ProgressData, useProgress } from "./hooks/useProgress";

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  fen: string;
  content: string;
  exercises: Exercise[];
  estimatedTime?: number;
  tags?: string[];
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  fen: string;
  correctMoves: string[];
}

const lessons: Lesson[] = [
  {
    id: "piece-movement",
    title: "How Pieces Move",
    description: "Learn how each chess piece moves on the board",
    difficulty: "beginner",
    estimatedTime: 10,
    tags: ["basics", "movement"],
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    content:
      "Each chess piece moves in a unique way. The pawn moves forward one square, but captures diagonally. The knight moves in an L-shape. The bishop moves diagonally. The rook moves horizontally and vertically. The queen combines the power of the bishop and rook. The king moves one square in any direction.",
    exercises: [
      {
        id: "pawn-movement",
        title: "Pawn Movement",
        description: "Move the pawn forward two squares from its starting position",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        correctMoves: ["e2e4", "d2d4", "c2c4", "a2a4", "b2b4", "f2f4", "g2g4", "h2h4"],
      },
      {
        id: "knight-movement",
        title: "Knight Movement",
        description: "Move the knight to a valid square",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        correctMoves: ["b1a3", "b1c3", "g1f3", "g1h3"],
      },
    ],
  },
  {
    id: "basic-checkmate",
    title: "Basic Checkmates",
    description: "Learn fundamental checkmate patterns",
    difficulty: "beginner",
    estimatedTime: 15,
    tags: ["checkmate", "tactics"],
    fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
    content:
      "Checkmate is the ultimate goal in chess. It occurs when the king is in check and has no legal moves to escape. In this lesson, we'll learn some basic checkmate patterns that every chess player should know.",
    exercises: [
      {
        id: "back-rank-mate",
        title: "Back Rank Mate",
        description: "Deliver checkmate with the rook",
        fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
        correctMoves: ["a1a8"],
      },
      {
        id: "queen-king-mate",
        title: "Queen and King Mate",
        description: "Deliver checkmate with the queen",
        fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
        correctMoves: ["f7h7"],
      },
    ],
  },
  {
    id: "basic-tactics",
    title: "Basic Tactics",
    description: "Learn fundamental tactical patterns",
    difficulty: "intermediate",
    estimatedTime: 20,
    tags: ["tactics", "combinations"],
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
    content:
      "Tactics are short-term combinations that lead to a concrete advantage. Common tactical patterns include forks, pins, skewers, and discovered attacks. Mastering these patterns is essential for chess improvement.",
    exercises: [
      {
        id: "knight-fork",
        title: "Knight Fork",
        description: "Find the knight fork",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1",
        correctMoves: ["f3e5"],
      },
      {
        id: "pin-tactic",
        title: "Pin Tactic",
        description: "Use the pin to win material",
        fen: "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        correctMoves: ["c4f7"],
      },
    ],
  },
  {
    id: "advanced-tactics",
    title: "Advanced Tactical Patterns",
    description: "Master complex tactical patterns and combinations",
    difficulty: "advanced",
    estimatedTime: 30,
    tags: ["advanced", "tactics", "combinations"],
    fen: "r1bqk2r/ppp2ppp/2n2n2/2bpp3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1",
    content:
      "Advanced tactics involve complex combinations of multiple tactical motifs. These include deflection, decoy, clearance, interference, and zwischenzug (intermediate move). Recognizing these patterns will significantly improve your calculation abilities and overall chess strength.",
    exercises: [
      {
        id: "deflection-tactic",
        title: "Deflection",
        description: "Use deflection to win material",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1",
        correctMoves: ["c4f7"],
      },
      {
        id: "zwischenzug",
        title: "Zwischenzug (Intermediate Move)",
        description: "Find the intermediate move before capturing",
        fen: "r1bqkb1r/ppp2ppp/2np1n2/4p3/4P3/2N2N2/PPPPBPPP/R1BQK2R w KQkq - 0 1",
        correctMoves: ["f3e5"],
      },
    ],
  },
];

function LessonCard({
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

export default function LessonsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedLessonTitle, setCompletedLessonTitle] = useState("");

  const calculateOverallProgress = (allProgress: Record<string, ProgressData>): number => {
    let totalExercises = 0;
    let completedExercises = 0;

    lessons.forEach((lesson) => {
      totalExercises += lesson.exercises.length;
      const progress = allProgress[lesson.id] || { exercisesCompleted: [] };
      completedExercises += progress.exercisesCompleted.length;
    });

    return totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  };

  const {
    progress: lessonProgress,
    overallProgress,
    updateExerciseCompletion,
    loadAllProgress,
    resetAllProgress,
  } = useProgress({
    prefix: "lesson_progress",
    calculateOverallProgress,
  });

  const {
    selectedCategory: selectedLesson,
    selectedExercise,
    currentFen,
    message,
    showHint,
    lastCorrectMove,
    showingCorrectAnimation,
    handleCategorySelect: handleLessonSelect,
    handleExerciseSelect,
    handleMove: handleMoveBase,
    toggleHint: handleShowHint,
    clearSelection,
  } = useExerciseState<Exercise, Lesson>({
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    onExerciseComplete: (lessonId, exerciseId) => {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) return;

      updateExerciseCompletion(lessonId, exerciseId, lesson.exercises.length, (completedLessonId) => {
        const completedLesson = lessons.find((l) => l.id === completedLessonId);
        if (completedLesson) {
          setCompletedLessonTitle(completedLesson.title);
          setShowCompletionModal(true);
        }
      });
    },
  });

  useEffect(() => {
    loadAllProgress(lessons.map((lesson) => lesson.id));
  }, []);

  const handleMove = (orig: string, dest: string) => {
    if (!selectedExercise || !selectedLesson) return;
    handleMoveBase(orig, dest, selectedExercise.correctMoves);
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && lesson.difficulty === activeTab;
  });

  return (
    <>
      <CompletionModal
        opened={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title={completedLessonTitle}
        onContinue={() => {
          setShowCompletionModal(false);
        }}
        onBackToList={() => {
          setShowCompletionModal(false);
          clearSelection();
        }}
      />

      <Stack gap="xl" p="md">
        {!selectedLesson ? (
          <>
            <Box>
              <Group justify="space-between" align="flex-start" mb="lg">
                <Box>
                  <Group gap="sm" mb="xs">
                    <ThemeIcon size={40} radius="md" variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
                      <IconBook size={24} />
                    </ThemeIcon>
                    <Title order={1} size="h2">
                      Interactive Lessons
                    </Title>
                  </Group>
                  <Text size="lg" c="dimmed">
                    Master chess through structured, interactive lessons designed to build your skills step by step
                  </Text>
                </Box>

                <Paper p="md" radius="md" withBorder>
                  <Center>
                    <RingProgress
                      size={100}
                      thickness={8}
                      roundCaps
                      sections={[{ value: overallProgress, color: "blue" }]}
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

              <Group gap="md" mb="lg">
                <TextInput
                  placeholder="Search lessons..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />

                <Tooltip label="Reset all progress (for testing)">
                  <ActionIcon variant="light" color="red" onClick={() => resetAllProgress(lessons.map((l) => l.id))}>
                    <IconX size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Tabs value={activeTab} onChange={(value) => setActiveTab(value || "all")}>
                <Tabs.List>
                  <Tabs.Tab value="all">All Lessons ({lessons.length})</Tabs.Tab>
                  <Tabs.Tab value="beginner" leftSection={<IconSchool size={16} />}>
                    Beginner ({lessons.filter((l) => l.difficulty === "beginner").length})
                  </Tabs.Tab>
                  <Tabs.Tab value="intermediate" leftSection={<IconTarget size={16} />}>
                    Intermediate ({lessons.filter((l) => l.difficulty === "intermediate").length})
                  </Tabs.Tab>
                  <Tabs.Tab value="advanced" leftSection={<IconRocket size={16} />}>
                    Advanced ({lessons.filter((l) => l.difficulty === "advanced").length})
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {filteredLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  progress={{
                    completed: lessonProgress[lesson.id]?.exercisesCompleted.length || 0,
                    total: lesson.exercises.length,
                  }}
                  onClick={() => handleLessonSelect(lesson)}
                />
              ))}
            </SimpleGrid>

            {filteredLessons.length === 0 && (
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center">
                    <ThemeIcon size={80} radius="md" variant="light" color="gray">
                      <IconSearch size={40} />
                    </ThemeIcon>
                    <Title order={3} c="dimmed">
                      No lessons found
                    </Title>
                    <Text c="dimmed">Try adjusting your search or filter criteria</Text>
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
                    <ActionIcon variant="light" onClick={clearSelection} aria-label="Back to lessons">
                      <IconArrowLeft size={20} />
                    </ActionIcon>
                    <Breadcrumbs separator="→">
                      <Anchor component="button" onClick={clearSelection}>
                        Lessons
                      </Anchor>
                      <Text>{selectedLesson.title}</Text>
                      {selectedExercise && <Text>{selectedExercise.title}</Text>}
                    </Breadcrumbs>
                  </Group>

                  {selectedExercise ? (
                    <Group>
                      <Tooltip label="Show hint">
                        <ActionIcon variant="light" color="yellow" onClick={handleShowHint} disabled={showHint}>
                          <IconBulb size={20} />
                        </ActionIcon>
                      </Tooltip>
                      <Button
                        variant="subtle"
                        leftSection={<IconArrowBack size={16} />}
                        onClick={() => {
                          const currentLessonIndex = lessons.findIndex((l) => l.id === selectedLesson.id);
                          if (currentLessonIndex >= 0) {
                            clearSelection();
                            handleLessonSelect(lessons[currentLessonIndex]);
                          }
                        }}
                      >
                        Back to Lesson
                      </Button>
                    </Group>
                  ) : (
                    <LinearProgress
                      completed={lessonProgress[selectedLesson.id]?.exercisesCompleted.length || 0}
                      total={selectedLesson.exercises.length}
                      size="sm"
                      width={200}
                    />
                  )}
                </Group>

                <Divider />

                {!selectedExercise ? (
                  <>
                    <Paper p="lg" withBorder radius="md">
                      <Stack gap="md">
                        <Group>
                          <Badge
                            size="lg"
                            variant="filled"
                            color={
                              selectedLesson.difficulty === "beginner"
                                ? "green"
                                : selectedLesson.difficulty === "intermediate"
                                  ? "blue"
                                  : "red"
                            }
                          >
                            {selectedLesson.difficulty.charAt(0).toUpperCase() + selectedLesson.difficulty.slice(1)}
                          </Badge>
                          {selectedLesson.estimatedTime && (
                            <Group gap="xs">
                              <IconClock size={16} />
                              <Text size="sm">{selectedLesson.estimatedTime} minutes</Text>
                            </Group>
                          )}
                        </Group>
                        <Text>{selectedLesson.content}</Text>
                      </Stack>
                    </Paper>

                    <Title order={4}>Exercises ({selectedLesson.exercises.length})</Title>
                    <SimpleGrid cols={1} spacing="md">
                      {selectedLesson.exercises.map((exercise, index) => {
                        const isCompleted = lessonProgress[selectedLesson.id]?.exercisesCompleted.includes(exercise.id);

                        return (
                          <ExerciseCard
                            key={exercise.id}
                            id={exercise.id}
                            title={`${index + 1}. ${exercise.title}`}
                            description={exercise.description}
                            isCompleted={isCompleted}
                            onClick={() => handleExerciseSelect(exercise)}
                          />
                        );
                      })}
                    </SimpleGrid>
                  </>
                ) : (
                  <>
                    <Title order={4}>{selectedExercise.title}</Title>
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
                            <Text>
                              Try these moves:{" "}
                              {selectedExercise.correctMoves.map((move) => (
                                <Badge key={move} mx={4} color="blue">
                                  {move.substring(0, 2)} → {move.substring(2)}
                                </Badge>
                              ))}
                            </Text>
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
