import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconBulb,
  IconCheck,
  IconClock,
  IconSearch,
  IconTarget,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CategoryCard } from "./components/CategoryCard";
import ChessExerciseBoardWithProvider from "./components/ChessExerciseBoard";
import { CompletionModal } from "./components/CompletionModal";
import { PracticeExerciseCard } from "./components/PracticeExerciseCard";
import { LinearProgress } from "./components/ProgressIndicator";
import { practiceCategories } from "./constants/practiceCategories";
import { useExerciseState } from "./hooks/useExerciseState";
import { type ProgressData, useProgress } from "./hooks/useProgress";

export interface PracticeExercise {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  fen: string;
  correctMoves: string[];
  points?: number;
  timeLimit?: number;
}

export interface PracticeCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  exercises: PracticeExercise[];
  estimatedTime?: number;
  group?: string;
}

export default function PracticePage() {
  const GROUPS = ["All", "Checkmates", "Basic Tactics", "Intermediate Tactics", "Pawn Endgames", "Rook Endgames"];
  const [activeTab, setActiveTab] = useState<string>(GROUPS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedCategoryTitle, setCompletedCategoryTitle] = useState("");
  const { navigate } = useRouter();

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
    updateExerciseCompletion,
    loadAllProgress,
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
    const matchesGroup = activeTab === "All" || category.group === activeTab;
    const matchesSearch =
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
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

      <Stack gap="sm" p="md">
        {!selectedCategory ? (
          <>
            <Group gap="lg" align="center" mb="md">
              <ActionIcon
                variant="light"
                size="md"
                onClick={() => navigate({ to: "/learn" })}
                aria-label="Back to Learn"
              >
                <IconArrowBackUp size={20} />
              </ActionIcon>
              <Breadcrumbs separator="→">
                <Text>Practice</Text>
              </Breadcrumbs>
            </Group>

            <Group mb="md" justify="space-between" align="center">
              <Button.Group>
                {GROUPS.map((group) => (
                  <Button
                    key={group}
                    variant={activeTab === group ? "filled" : "default"}
                    onClick={() => setActiveTab(group)}
                  >
                    {group}
                  </Button>
                ))}
              </Button.Group>

              <TextInput
                placeholder="Search practice categories..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                w="300px"
              />
            </Group>

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
            <Stack gap="md" flex={1}>
              <Group justify="space-between">
                <Group>
                  <ActionIcon
                    variant="light"
                    onClick={() => {
                      const currentCategoryIndex = practiceCategories.findIndex((c) => c.id === selectedCategory.id);
                      if (currentCategoryIndex >= 0) {
                        clearSelection();
                        handleCategorySelect(practiceCategories[currentCategoryIndex]);
                      }
                    }}
                    aria-label="Back to Learn"
                  >
                    <IconArrowBackUp size={20} />
                  </ActionIcon>
                  <Breadcrumbs separator="→">
                    <Anchor component="button" onClick={clearSelection}>
                      Practice
                    </Anchor>
                    <Text>{selectedCategory.title}</Text>
                    {selectedExercise && <Text>{selectedExercise.title}</Text>}
                  </Breadcrumbs>
                </Group>

                <LinearProgress
                  completed={practiceProgress[selectedCategory.id]?.exercisesCompleted.length || 0}
                  total={selectedCategory.exercises.length}
                  size="md"
                  width={200}
                />
              </Group>

              <Divider />

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
                  const isCompleted = practiceProgress[selectedCategory.id]?.exercisesCompleted.includes(exercise.id);

                  return (
                    <PracticeExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      index={index}
                      isCompleted={isCompleted}
                      onClick={() => handleExerciseSelect(exercise)}
                    />
                  );
                })}
              </Stack>
            </Stack>

            <Box flex={1}>
              <ChessExerciseBoardWithProvider
                fen={currentFen}
                onMove={handleMove}
                lastCorrectMove={lastCorrectMove}
                showingCorrectAnimation={showingCorrectAnimation}
                readOnly={!selectedExercise}
              />

              {selectedExercise && (
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
                    <Group justify="space-between" align="center">
                      <Text>{selectedExercise.description}</Text>
                      <Tooltip label="Show hint">
                        <ActionIcon variant="light" color="yellow" onClick={toggleHint} disabled={showHint}>
                          <IconBulb size={20} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
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
            </Box>
          </Flex>
        )}
      </Stack>
    </>
  );
}
