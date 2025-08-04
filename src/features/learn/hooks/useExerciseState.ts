import { useCallback, useState } from "react";

interface ExerciseBase {
  id: string;
  title: string;
  description: string;
  fen: string;
}

interface UseExerciseStateOptions<T extends ExerciseBase, C extends { id: string; exercises: T[] }> {
  initialFen?: string;
  onExerciseComplete?: (categoryId: string, exerciseId: string) => void;
}

export function useExerciseState<T extends ExerciseBase, C extends { id: string; exercises: T[] }>(
  options: UseExerciseStateOptions<T, C> = {},
) {
  const { initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", onExerciseComplete } = options;

  const [selectedCategory, setSelectedCategory] = useState<C | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<T | null>(null);
  const [currentFen, setCurrentFen] = useState<string>(initialFen);
  const [message, setMessage] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);
  const [lastCorrectMove, setLastCorrectMove] = useState<{ from: string; to: string } | null>(null);
  const [showingCorrectAnimation, setShowingCorrectAnimation] = useState<boolean>(false);

  const resetState = useCallback(() => {
    setMessage("");
    setShowHint(false);
    setLastCorrectMove(null);
    setShowingCorrectAnimation(false);
  }, []);

  const handleCategorySelect = useCallback(
    (category: C) => {
      setSelectedCategory(category);
      setSelectedExercise(null);
      setCurrentFen(category.exercises[0]?.fen || initialFen);
      resetState();
    },
    [initialFen, resetState],
  );

  const handleExerciseSelect = useCallback(
    (exercise: T) => {
      setSelectedExercise(exercise);
      setCurrentFen(exercise.fen);
      resetState();
    },
    [resetState],
  );

  const handleMove = useCallback(
    (orig: string, dest: string, correctMoves: string[], onCorrectMove?: () => void) => {
      if (!selectedExercise || !selectedCategory) return;

      const move = `${orig}${dest}`;
      const isCorrect = correctMoves.includes(move);

      if (isCorrect) {
        setMessage("Correct!");
        setLastCorrectMove({ from: orig, to: dest });
        setShowingCorrectAnimation(true);

        setTimeout(() => {
          setShowingCorrectAnimation(false);
        }, 2000);

        if (onCorrectMove) {
          onCorrectMove();
        }

        if (onExerciseComplete) {
          onExerciseComplete(selectedCategory.id, selectedExercise.id);
        }
      } else {
        setMessage("Incorrect. Try again.");
        setLastCorrectMove(null);
      }
    },
    [selectedCategory, selectedExercise, onExerciseComplete],
  );

  const toggleHint = useCallback(() => {
    setShowHint((prev) => !prev);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCategory(null);
    setSelectedExercise(null);
    setCurrentFen(initialFen);
    resetState();
  }, [initialFen, resetState]);

  return {
    selectedCategory,
    selectedExercise,
    currentFen,
    message,
    showHint,
    lastCorrectMove,
    showingCorrectAnimation,

    setCurrentFen,
    handleCategorySelect,
    handleExerciseSelect,
    handleMove,
    toggleHint,
    clearSelection,
    resetState,
  };
}
