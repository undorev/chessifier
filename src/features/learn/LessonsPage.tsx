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
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconArrowBackUp, IconBulb, IconCheck, IconClock, IconX } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { applyUciMoveToFen } from "@/utils/applyUciMoveToFen";
import { useUserStatsStore } from "../../state/userStatsStore";
import ChessExerciseBoardWithProvider from "./components/ChessExerciseBoard";
import { CompletionModal } from "./components/CompletionModal";
import { LessonCard } from "./components/LessonCard";
import { LessonExerciseCard } from "./components/LessonExerciseCard";
import { LinearProgress } from "./components/ProgressIndicator";
import { lessons } from "./constants/lessons";
import { useExerciseState } from "./hooks/useExerciseState";

export interface Lesson {
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

export interface Exercise {
  id: string;
  title: string;
  description: string;
  fen: string;
  correctMoves: string[];
}

export default function LessonsPage() {
  const navigate = useNavigate();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedLessonTitle, setCompletedLessonTitle] = useState("");

  const { userStats, setUserStats } = useUserStatsStore();

  const {
    selectedCategory: selectedLesson,
    selectedExercise,
    currentFen,
    setCurrentFen,
    message,
    showHint,
    handleCategorySelect: handleLessonSelect,
    handleExerciseSelect,
    handleMove: handleMoveBase,
    toggleHint: handleShowHint,
    clearSelection,
  } = useExerciseState<Exercise, Lesson>({
    initialFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
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
          setCompletedLessonTitle(lesson.title);
          setShowCompletionModal(true);
        }
      }
    },
  });

  const handleMove = (orig: string, dest: string) => {
    if (!selectedExercise || !selectedLesson) return;
    const move = `${orig}${dest}`;
    handleMoveBase(orig, dest, selectedExercise.correctMoves, () => {
      const newFen = applyUciMoveToFen(currentFen, move);
      if (newFen) setCurrentFen(newFen);
    });
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
                    lesson={lesson}
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
                    <Text>{selectedLesson.title}</Text>
                    {selectedExercise && <Text>{selectedExercise.title}</Text>}
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
                  <Text>{selectedLesson.content}</Text>
                </Stack>
              </Paper>

              <Title order={4}>Exercises ({selectedLesson.exercises.length})</Title>
              <SimpleGrid cols={1} spacing="md">
                {selectedLesson.exercises.map((exercise, index) => {
                  const isCompleted = userStats.completedExercises?.[selectedLesson.id]?.includes(exercise.id) || false;
                  return (
                    <LessonExerciseCard
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
            </Stack>

            <Box flex={1}>
              <ChessExerciseBoardWithProvider
                fen={selectedExercise ? currentFen : "8/8/8/8/8/8/8/8 w - - 0 1"}
                onMove={handleMove}
                readOnly={!selectedExercise}
              />

              {selectedExercise && (
                <>
                  <Paper mt="md" p="md" withBorder>
                    <Group justify="space-between" align="center">
                      <Text>{selectedExercise.description}</Text>
                      <Tooltip label="Show hint">
                        <ActionIcon variant="light" color="yellow" onClick={handleShowHint} disabled={showHint}>
                          <IconBulb size={20} />
                        </ActionIcon>
                      </Tooltip>
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

                  {showHint && (
                    <Paper my="md" p="md" withBorder bg="rgba(255,223,0,0.1)">
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
            </Box>
          </Flex>
        )}
      </Stack>
    </>
  );
}
