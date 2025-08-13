import {
  ActionIcon,
  Anchor,
  Box,
  Breadcrumbs,
  Button,
  Center,
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
import PracticeBoardWithProvider from "./components/practice/PracticeBoard";
import { PracticeCard } from "./components/practice/PracticeCard";
import { PracticeExerciseCard } from "./components/practice/PracticeExerciseCard";
import { type PracticeCategory, type PracticeExercise, practices, uiConfig } from "./constants/practices";
import { useExerciseState } from "./hooks/useExerciseState";

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
    selectedCategory: selectedPractice,
    selectedExercise,
    currentFen,
    setCurrentFen,
    message,
    playerMoveCount,
    handleCategorySelect: handlePracticeSelect,
    handleExerciseSelect,
    handleMove: handleMoveBase,
    clearSelection,
    resetExercise,
  } = useExerciseState<PracticeExercise, PracticeCategory>({
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    onExerciseComplete: (practiceId, exerciseId, evaluation) => {
      console.log(`Exercise completed with evaluation:`, evaluation);

      const prevCompleted = userStats.completedPractice?.[practiceId] || [];
      if (!prevCompleted.includes(exerciseId)) {
        const updatedCompleted = {
          ...userStats.completedPractice,
          [practiceId]: [...prevCompleted, exerciseId],
        };

        let totalPoints = 0;
        for (const [practiceId, exIds] of Object.entries(updatedCompleted)) {
          const practice = practices.find((c) => c.id === practiceId);
          if (practice) {
            for (const exId of exIds) {
              const exercise = practice.exercises.find((ex) => ex.id === exId);
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

        const practice = practices.find((c) => c.id === practiceId);
        if (practice && updatedCompleted[practiceId]?.length === practice.exercises.length) {
          setCompletedCategoryTitle(practice.title);
          setShowCompletionModal(true);
        }
      }

      if (selectedPractice && selectedExercise) {
        const currentIndex = selectedPractice.exercises.findIndex(
          (ex: PracticeExercise) => ex.id === selectedExercise.id,
        );
        if (currentIndex < selectedPractice.exercises.length - 1) {
          setTimeout(() => {
            const nextExercise = selectedPractice.exercises[currentIndex + 1];
            handleExerciseSelect(nextExercise);
            setCurrentFen(nextExercise?.gameData?.fen);
          }, 1500);
        }
      }
    },
  });

  const handleMove = (orig: string, dest: string) => {
    if (!selectedExercise || !selectedPractice) return;
    const move = `${orig}${dest}`;
    handleMoveBase(orig, dest, selectedExercise?.gameData.correctMoves || [], () => {
      const newFen = applyUciMoveToFen(currentFen, move);
      if (newFen) setCurrentFen(newFen);
    });
  };

  const filteredPractices = practices.filter((practice) => {
    const practiceGroupName = uiConfig.groups[practice.group]?.label || practice.group;
    const matchesGroup = activeTab === "All" || practiceGroupName === activeTab;
    const matchesSearch =
      practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      practice.description.toLowerCase().includes(searchQuery.toLowerCase());
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
        {!selectedPractice ? (
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
              {filteredPractices.map((practice) => {
                const completedCount = userStats.completedPractice?.[practice.id]?.length || 0;
                return (
                  <PracticeCard
                    key={practice.id}
                    category={{
                      id: practice.id,
                      title: practice.title,
                      description: practice.description,
                      icon: uiConfig.icons[practice.iconName] || uiConfig.icons.crown,
                      color: practice.color,
                      exercises: practice.exercises.map((exercise) => ({
                        id: exercise.id,
                        title: exercise.title,
                        description: exercise.description,
                        difficulty: exercise.difficulty,
                        fen: exercise.gameData.fen,
                        correctMoves: exercise.gameData.correctMoves ? [...exercise.gameData.correctMoves] : undefined,
                        points: exercise.points,
                        timeLimit: exercise.timeLimit,
                        stepsCount: exercise.stepsCount,
                      })),
                      estimatedTime: practice.estimatedTime,
                      group: uiConfig.groups[practice.group]?.label || practice.group,
                    }}
                    progress={{
                      completed: completedCount,
                      total: practice.exercises.length,
                    }}
                    onClick={() => handlePracticeSelect(practice)}
                  />
                );
              })}
            </SimpleGrid>

            {filteredPractices.length === 0 && (
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
          <>
            <Group justify="space-between">
              <Group>
                <ActionIcon
                  variant="light"
                  onClick={() => {
                    if (selectedExercise) {
                      const currentPracticeIndex = practices.findIndex((c) => c.id === selectedPractice.id);
                      if (currentPracticeIndex >= 0) {
                        clearSelection();
                        handlePracticeSelect(practices[currentPracticeIndex]);
                      }
                    } else {
                      handlePracticeSelect(null);
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
                  <Text>{selectedPractice.title}</Text>
                  {selectedExercise && <Text>{selectedExercise.title}</Text>}
                </Breadcrumbs>
              </Group>

              <Group>
                <ActionIcon variant="light" color="blue" onClick={resetExercise} title="Reset exercise">
                  <IconRefresh size={20} />
                </ActionIcon>

                <Popover position="bottom-end" shadow="md" opened={opened}>
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

            <Flex gap="xl" align="flex-start">
              <Stack gap="md" flex={1}>
                <Paper p="lg" withBorder radius="md">
                  <Group gap="md" mb="md">
                    <ThemeIcon size={40} variant="gradient" gradient={{ from: selectedPractice.color, to: "cyan" }}>
                      {uiConfig.icons[selectedPractice.iconName] || uiConfig.icons.crown}
                    </ThemeIcon>
                    <Box>
                      <Title order={3}>{selectedPractice.title}</Title>
                      <Text c="dimmed">{selectedPractice.description}</Text>
                    </Box>
                  </Group>

                  <Group gap="lg">
                    <Group gap="xs">
                      <IconTarget size={16} />
                      <Text size="sm">{selectedPractice.exercises.length} exercises</Text>
                    </Group>
                    <Group gap="xs">
                      <IconClock size={16} />
                      <Text size="sm">{selectedPractice.estimatedTime} minutes</Text>
                    </Group>
                    <Group gap="xs">
                      <IconTrophy size={16} />
                      <Text size="sm">
                        {selectedPractice.exercises.reduce(
                          (sum: number, ex: PracticeExercise) => sum + (ex.points || 0),
                          0,
                        )}{" "}
                        points
                      </Text>
                    </Group>
                  </Group>
                </Paper>

                <Title order={4}>Exercises ({selectedPractice.exercises.length})</Title>
                <Stack gap="md">
                  {selectedPractice.exercises.map((exercise: PracticeExercise, index: number) => {
                    const isCompleted =
                      userStats.completedPractice?.[selectedPractice.id]?.includes(exercise.id) || false;
                    return (
                      <PracticeExerciseCard
                        key={exercise.id}
                        exercise={{
                          id: exercise.id,
                          title: exercise.title,
                          description: exercise.description,
                          difficulty: exercise.difficulty,
                          fen: exercise.gameData.fen,
                          correctMoves: exercise.gameData.correctMoves
                            ? [...exercise.gameData.correctMoves]
                            : undefined,
                          points: exercise.points,
                          timeLimit: exercise.timeLimit,
                          stepsCount: exercise.stepsCount,
                        }}
                        index={index}
                        isCompleted={isCompleted}
                        onClick={() => {
                          handleExerciseSelect(exercise);
                          setCurrentFen(exercise?.gameData?.fen);
                        }}
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
                    {message && (
                      <Paper
                        my="md"
                        p="md"
                        withBorder
                        bg={
                          message.includes("Correct") || message.includes("Perfect") || message.includes("Excellent")
                            ? "rgba(0,128,0,0.1)"
                            : message.includes("Checkmate")
                              ? "rgba(255,165,0,0.1)"
                              : "rgba(255,0,0,0.1)"
                        }
                      >
                        <Group>
                          {message.includes("Correct") ||
                          message.includes("Perfect") ||
                          message.includes("Excellent") ? (
                            <IconCheck size={20} color="green" />
                          ) : message.includes("Checkmate") ? (
                            <IconTrophy size={20} color="orange" />
                          ) : (
                            <IconX size={20} color="red" />
                          )}
                          <Text
                            fw={500}
                            c={
                              message.includes("Correct") ||
                              message.includes("Perfect") ||
                              message.includes("Excellent")
                                ? "green"
                                : message.includes("Checkmate")
                                  ? "orange"
                                  : "red"
                            }
                          >
                            {message}
                          </Text>
                        </Group>
                      </Paper>
                    )}

                    {selectedExercise?.stepsCount && (
                      <Paper mt="md" p="md" withBorder bg="rgba(59, 130, 246, 0.1)">
                        <Group>
                          <IconTarget size={20} color="#1c7ed6" />
                          <Text size="sm" c="blue">
                            Target: Checkmate in {selectedExercise.stepsCount} moves | Current moves:{" "}
                            {playerMoveCount}
                          </Text>
                        </Group>
                      </Paper>
                    )}
                  </>
                )}
              </Box>
            </Flex>
          </>
        )}
      </Stack>
    </>
  );
}
