import {
  ActionIcon,
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  Paper,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconBulb,
  IconCheck,
  IconClock,
  IconRefresh,
  IconSearch,
  IconTarget,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { applyUciMoveToFen } from "@/utils/applyUciMoveToFen";
import { useUserStatsStore } from "../../state/userStatsStore";
import { CompletionModal } from "./components/CompletionModal";
import { LinearProgress } from "./components/ProgressIndicator";
import PracticeBoardWithProvider from "./components/practice/PracticeBoard";
import { PracticeCard } from "./components/practice/PracticeCard";
import { PracticeExerciseCard } from "./components/practice/PracticeExerciseCard";
import { practiceCategories } from "./constants/practices";
import { useExerciseState } from "./hooks/useExerciseState";

export interface PracticeExercise {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  fen: string;
  correctMoves?: string[];
  points?: number;
  timeLimit?: number;
  stepsCount?: number;
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
  const [opened, { close, open }] = useDisclosure(false);

  const { userStats, setUserStats } = useUserStatsStore();

  const {
    selectedCategory,
    selectedExercise,
    currentFen,
    setCurrentFen,
    message,
    moveHistory,
    handleCategorySelect,
    handleExerciseSelect,
    handleMove: handleMoveBase,
    clearSelection,
    resetExercise,
  } = useExerciseState<PracticeExercise, PracticeCategory>({
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    onExerciseComplete: (categoryId, exerciseId, evaluation) => {
      console.log(`Exercise completed with evaluation:`, evaluation);
      
      const prevCompleted = userStats.completedPractice?.[categoryId] || [];
      if (!prevCompleted.includes(exerciseId)) {
        const updatedCompleted = {
          ...userStats.completedPractice,
          [categoryId]: [...prevCompleted, exerciseId],
        };

        let totalPoints = 0;
        for (const [catId, exIds] of Object.entries(updatedCompleted)) {
          const category = practiceCategories.find((c) => c.id === catId);
          if (category) {
            for (const exId of exIds) {
              const exercise = category.exercises.find((ex) => ex.id === exId);
              if (exercise?.points) {
                totalPoints += exercise.points;
              }
            }
          }
        }

        setUserStats({
          completedPractice: updatedCompleted,
          practiceCompleted: Object.values(updatedCompleted).reduce((sum, arr) => sum + arr.length, 0),
          totalPoints,
        });

        const category = practiceCategories.find((c) => c.id === categoryId);
        if (category && updatedCompleted[categoryId]?.length === category.exercises.length) {
          setCompletedCategoryTitle(category.title);
          setShowCompletionModal(true);
        }
      }

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

  const handleMove = (orig: string, dest: string) => {
    if (!selectedExercise || !selectedCategory) return;
    const move = `${orig}${dest}`;
    handleMoveBase(orig, dest, selectedExercise?.correctMoves || [], () => {
      const newFen = applyUciMoveToFen(currentFen, move);
      if (newFen) setCurrentFen(newFen);
    });
  };

  const filteredCategories = practiceCategories.filter((category) => {
    const matchesGroup = activeTab === "All" || category.group === activeTab;
    const matchesSearch =
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

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
                title="Back to Learn"
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
              {filteredCategories.map((category) => {
                const completedCount = userStats.completedPractice?.[category.id]?.length || 0;
                return (
                <PracticeCard
                    key={category.id}
                    category={category}
                    progress={{
                      completed: completedCount,
                      total: category.exercises.length,
                    }}
                    onClick={() => handleCategorySelect(category)}
                  />
                );
              })}
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
                      if (selectedExercise) {
                        const currentCategoryIndex = practiceCategories.findIndex((c) => c.id === selectedCategory.id);
                        if (currentCategoryIndex >= 0) {
                          clearSelection();
                          handleCategorySelect(practiceCategories[currentCategoryIndex]);
                        }
                      } else {
                        handleCategorySelect(null);
                        navigate({ to: "/learn/practice" });
                      }
                    }}
                    aria-label="Back to Practice"
                    title="Back to Practice"
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
                  completed={userStats.completedPractice?.[selectedCategory.id]?.length || 0}
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
                  const isCompleted =
                    userStats.completedPractice?.[selectedCategory.id]?.includes(exercise.id) || false;
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
              <PracticeBoardWithProvider
                fen={selectedExercise ? currentFen : "8/8/8/8/8/8/8/8 w - - 0 1"}
                orientation="white"
                engineColor="black"
                onMove={(move) => console.log("Move made:", move)}
                onPositionChange={(fen) => console.log("Position changed:", fen)}
                onChessMove={handleMove}
              />

              {selectedExercise && (
                <>
                  <Paper mt="md" p="md" withBorder>
                    <Group justify="space-between" align="center">
                      <Text>{selectedExercise.description}</Text>
                      <Group>
                        <ActionIcon 
                          variant="light" 
                          color="blue" 
                          onClick={resetExercise}
                          title="Reset exercise"
                        >
                          <IconRefresh size={20} />
                        </ActionIcon>
                        <Popover position="top-end" shadow="md" opened={opened}>
                          <Popover.Target>
                            <ActionIcon variant="light" color="yellow" onMouseEnter={open} onMouseLeave={close}>
                              <IconBulb size={20} />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown style={{ pointerEvents: "none" }}>
                            <Text>Look for the best move in this position. Consider all tactical motifs!</Text>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Group>
                  </Paper>

                  {message && (
                    <Paper
                      my="md"
                      p="md"
                      withBorder
                      bg={message.includes("Correct") || message.includes("Perfect") || message.includes("Excellent") ? "rgba(0,128,0,0.1)" : message.includes("Checkmate") ? "rgba(255,165,0,0.1)" : "rgba(255,0,0,0.1)"}
                    >
                      <Group>
                        {message.includes("Correct") || message.includes("Perfect") || message.includes("Excellent") ? (
                          <IconCheck size={20} color="green" />
                        ) : message.includes("Checkmate") ? (
                          <IconTrophy size={20} color="orange" />
                        ) : (
                          <IconX size={20} color="red" />
                        )}
                        <Text fw={500} c={message.includes("Correct") || message.includes("Perfect") || message.includes("Excellent") ? "green" : message.includes("Checkmate") ? "orange" : "red"}>
                          {message}
                        </Text>
                      </Group>
                    </Paper>
                  )}

                  {selectedExercise?.stepsCount && (
                    <Paper mt="md" p="md" withBorder bg="rgba(59, 130, 246, 0.1)">
                      <Group>
                        <IconTarget size={20} color="blue" />
                        <Text size="sm" c="blue">
                          Target: Checkmate in {selectedExercise.stepsCount} moves | Current moves: {moveHistory.length}
                        </Text>
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
