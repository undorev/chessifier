import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Divider,
  Flex,
  Group,
  Paper,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconBulb,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconX,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { applyUciMoveToFen } from "@/utils/applyUciMoveToFen";
import { useUserStatsStore } from "../../state/userStatsStore";
import { CompletionModal } from "./components/CompletionModal";
import LessonBoardWithProvider from "./components/lessons/LessonBoard";
import { LessonCard } from "./components/lessons/LessonCard";
import { LessonExerciseCard } from "./components/lessons/LessonExerciseCard";
import { LinearProgress } from "./components/ProgressIndicator";
import { type Lesson, type LessonExercise, lessons } from "./constants/lessons";
import { useExerciseState } from "./hooks/useExerciseState";

export default function LessonsPage() {
  const navigate = useNavigate();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedLessonTitle, setCompletedLessonTitle] = useState("");
  const [opened, { close, open }] = useDisclosure(false);

  const { userStats, setUserStats } = useUserStatsStore();

  const {
    selectedCategory: selectedLesson,
    selectedExercise,
    currentFen,
    setCurrentFen,
    message,
    handleCategorySelect: handleLessonSelect,
    handleExerciseSelect,
    handleMove: handleMoveBase,
    clearSelection,
    resetState,
  } = useExerciseState<LessonExercise, Lesson>({
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    completeOnCorrectMove: false,
    onExerciseComplete: (lessonId, exerciseId) => {
      const prevCompleted = userStats.completedExercises?.[lessonId] || [];
      if (!prevCompleted.includes(exerciseId)) {
        const updatedCompleted = {
          ...userStats.completedExercises,
          [lessonId]: [...prevCompleted, exerciseId],
        };
        setUserStats({
          completedExercises: updatedCompleted,
          lessonsCompleted: Object.values(updatedCompleted).reduce((sum, arr) => sum + arr.length, 0),
        });
        const lesson = lessons.find((l) => l.id === lessonId);
        if (lesson && updatedCompleted[lessonId]?.length === lesson.exercises.length) {
          setCompletedLessonTitle(lesson.title.default);
          setShowCompletionModal(true);
          const today = new Date().toISOString();
          setUserStats({
            completionDates: [...(userStats.completionDates || []), today],
            lessonCompletionDates: [today],
          });
        }
      }
    },
  });

  const [variationIndex, setVariationIndex] = useState<number>(0);

  const getActiveVariation = () => {
    if (!selectedExercise) return null;
    if (selectedExercise.gameData.variations && selectedExercise.gameData.variations.length > 0) {
      return selectedExercise.gameData.variations[variationIndex] || selectedExercise.gameData.variations[0];
    }

    if (selectedExercise.gameData.fen && selectedExercise.gameData.correctMoves) {
      return { fen: selectedExercise.gameData.fen, correctMoves: selectedExercise.gameData.correctMoves };
    }
    return null;
  };

  const handleMove = (orig: string, dest: string) => {
    if (!selectedExercise || !selectedLesson) return;
    const activeVar = getActiveVariation();
    if (!activeVar) return;
    const move = `${orig}${dest}`;
    handleMoveBase(orig, dest, activeVar.correctMoves, () => {
      const newFen = applyUciMoveToFen(currentFen, move);
      if (newFen) setCurrentFen(newFen);

      const total = selectedExercise.gameData.variations?.length || 1;
      if (variationIndex < total - 1) {
        setTimeout(() => {
          const nextIndex = variationIndex + 1;
          setVariationIndex(nextIndex);
          const nextVar = selectedExercise.gameData.variations?.[nextIndex] || activeVar;
          if (nextVar?.fen) setCurrentFen(nextVar.fen);
        }, 600);
      } else {
        const lessonId = selectedLesson.id;
        const exerciseId = selectedExercise.id;

        setTimeout(() => {
          if (selectedLesson?.id === lessonId && selectedExercise?.id === exerciseId) {
            const prevCompleted = userStats.completedExercises?.[lessonId] || [];
            if (!prevCompleted.includes(exerciseId)) {
              const updatedCompleted = {
                ...userStats.completedExercises,
                [lessonId]: [...prevCompleted, exerciseId],
              };
              setUserStats({
                completedExercises: updatedCompleted,
                lessonsCompleted: Object.values(updatedCompleted).reduce((sum, arr) => sum + arr.length, 0),
              });
              const lesson = lessons.find((l) => l.id === lessonId);
              if (lesson && updatedCompleted[lessonId]?.length === lesson.exercises.length) {
                setCompletedLessonTitle(lesson.title.default);
                setShowCompletionModal(true);
                const todayStr = new Date().toISOString();
                setUserStats({
                  completionDates: [...(userStats.completionDates || []), todayStr],
                  lessonCompletionDates: [todayStr],
                });
              }
            }
          }
        }, 500);
      }
    });
  };

  const handleExerciseSelectWithReset = (exercise: LessonExercise) => {
    setVariationIndex(0);
    handleExerciseSelect(exercise);
    const active = exercise.gameData.variations?.[0];
    if (active?.fen) setCurrentFen(active.fen);
  };

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

      <Stack gap="sm" p="md">
        {!selectedLesson ? (
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
                <Text>Lessons</Text>
              </Breadcrumbs>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {lessons.map((lesson) => {
                const completedCount = userStats.completedExercises?.[lesson.id]?.length || 0;
                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={{
                      id: lesson.id,
                      title: lesson.title.default,
                      description: lesson.description.default,
                      difficulty: lesson.difficulty,
                      fen: lesson.fen || "8/8/8/8/8/8/8/8 w - - 0 1",
                      content: lesson.content.introduction?.default || lesson.content.theory?.default || "",
                      estimatedTime: lesson.estimatedTime,
                      tags: lesson.tags ? [...lesson.tags] : undefined,
                      exercises: lesson.exercises.map((exercise) => ({
                        id: exercise.id,
                        title: exercise.title.default,
                        description: exercise.description.default,
                        variations:
                          exercise.gameData?.variations?.map((variation) => ({
                            fen: variation.fen,
                            correctMoves: [...variation.correctMoves],
                          })) || [],
                        disabled: exercise.disabled,
                      })),
                    }}
                    progress={{
                      completed: completedCount,
                      total: lesson.exercises.length,
                    }}
                    onClick={() => handleLessonSelect(lesson)}
                  />
                );
              })}
            </SimpleGrid>
          </>
        ) : (
          <Flex gap="xl" align="flex-start">
            <Stack gap="md" flex={1}>
              <Group justify="space-between">
                <Group gap="lg">
                  <ActionIcon
                    variant="light"
                    onClick={() => {
                      if (selectedExercise) {
                        const currentLessonIndex = lessons.findIndex((l) => l.id === selectedLesson.id);
                        if (currentLessonIndex >= 0) {
                          clearSelection();
                          handleLessonSelect(lessons[currentLessonIndex]);
                        }
                      } else {
                        handleLessonSelect(null);
                        navigate({ to: "/learn/lessons" });
                      }
                    }}
                    aria-label="Back to Lessons"
                    title="Back to Lessons"
                  >
                    <IconArrowBackUp size={20} />
                  </ActionIcon>
                  <Breadcrumbs separator="→">
                    <Anchor component="button" onClick={clearSelection}>
                      Lessons
                    </Anchor>
                    <Text>{selectedLesson.title.default}</Text>
                    {selectedExercise && <Text>{selectedExercise.title.default}</Text>}
                  </Breadcrumbs>
                </Group>

                <LinearProgress
                  completed={userStats.completedExercises?.[selectedLesson.id]?.length || 0}
                  total={selectedLesson.exercises.length}
                  size="md"
                  width={200}
                />
              </Group>

              <Divider />

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
                  <Text>
                    {selectedLesson.content.introduction?.default || selectedLesson.content.theory?.default || ""}
                  </Text>
                </Stack>
              </Paper>

              <Title order={4}>Exercises ({selectedLesson.exercises.length})</Title>
              <SimpleGrid cols={1} spacing="md">
                {selectedLesson.exercises.map((exercise: LessonExercise, index: number) => {
                  const isCompleted = userStats.completedExercises?.[selectedLesson.id]?.includes(exercise.id) || false;
                  return (
                    <LessonExerciseCard
                      key={exercise.id}
                      id={exercise.id}
                      title={`${index + 1}. ${exercise.title.default}`}
                      description={exercise.description.default}
                      disabled={exercise?.disabled}
                      isCompleted={isCompleted}
                      onClick={() => handleExerciseSelectWithReset(exercise)}
                    />
                  );
                })}
              </SimpleGrid>
            </Stack>

            <Box flex={1}>
              <LessonBoardWithProvider
                fen={selectedExercise ? currentFen : "8/8/8/8/8/8/8/8 w - - 0 1"}
                onMove={handleMove}
                readOnly={!selectedExercise}
              />

              {selectedExercise && (
                <>
                  <Paper mt="md" p="md" withBorder>
                    <Group justify="space-between" align="center">
                      <Text>{selectedExercise.description.default}</Text>
                      <Popover position="top-end" shadow="md" opened={opened}>
                        <Popover.Target>
                          <ActionIcon variant="light" color="yellow" onMouseEnter={open} onMouseLeave={close}>
                            <IconBulb size={20} />
                          </ActionIcon>
                        </Popover.Target>
                        <Popover.Dropdown style={{ pointerEvents: "none" }}>
                          <Text mb="lg">Try these moves:</Text>
                          <SimpleGrid cols={{ base: 3, sm: 3, lg: 3 }} spacing="md">
                            {(getActiveVariation()?.correctMoves || []).map((move: string) => (
                              <Badge key={move} color="blue">
                                {move.substring(0, 2)} → {move.substring(2)}
                              </Badge>
                            ))}
                          </SimpleGrid>
                        </Popover.Dropdown>
                      </Popover>
                    </Group>
                  </Paper>

                  {message && (
                    <Paper
                      my="md"
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
                </>
              )}

              {selectedExercise && (
                <Group mt="xs" justify="space-between" align="center">
                  <Group gap="xs">
                    <ActionIcon
                      variant="default"
                      onClick={() => {
                        if (!selectedExercise?.gameData.variations) return;
                        const next = Math.max(0, variationIndex - 1);
                        setVariationIndex(next);
                        const v = selectedExercise.gameData.variations[next];
                        if (v?.fen) setCurrentFen(v.fen);
                        resetState();
                      }}
                      disabled={!selectedExercise?.gameData.variations || variationIndex === 0}
                    >
                      <IconChevronLeft size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="default"
                      onClick={() => {
                        if (!selectedExercise?.gameData.variations) return;
                        const total = selectedExercise.gameData.variations.length;
                        const next = Math.min(total - 1, variationIndex + 1);
                        setVariationIndex(next);
                        const v = selectedExercise.gameData.variations[next];
                        if (v?.fen) setCurrentFen(v.fen);
                        resetState();
                      }}
                      disabled={
                        !selectedExercise?.gameData.variations ||
                        variationIndex >= selectedExercise.gameData.variations.length - 1
                      }
                    >
                      <IconChevronRight size={18} />
                    </ActionIcon>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Variation {Math.min(variationIndex + 1, selectedExercise?.gameData.variations?.length || 1)} /{" "}
                    {selectedExercise?.gameData.variations?.length || 1}
                  </Text>
                </Group>
              )}
            </Box>
          </Flex>
        )}
      </Stack>
    </>
  );
}
