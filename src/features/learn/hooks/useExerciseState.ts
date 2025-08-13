import { useCallback, useState } from "react";
import { evaluateCheckmateMoves, type MoveEvaluation } from "@/utils/checkmateDetection";

interface ExerciseBase {
  id: string;
  title: string | { default: string };
  description: string | { default: string };
  fen?: string;
  stepsCount?: number;
}

interface CategoryBase {
  id: string;
  exercises: readonly ExerciseBase[];
}

interface UseExerciseStateOptions {
  initialFen?: string;
  onExerciseComplete?: (categoryId: string, exerciseId: string, evaluation: MoveEvaluation) => void;
  completeOnCorrectMove?: boolean;
}

export function useExerciseState<T extends ExerciseBase, C extends CategoryBase>(
  options: UseExerciseStateOptions = {},
) {
  const {
    initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    onExerciseComplete,
    completeOnCorrectMove = true,
  } = options;

  const [selectedCategory, setSelectedCategory] = useState<C | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<T | null>(null);
  const [currentFen, setCurrentFen] = useState<string>(initialFen);
  const [message, setMessage] = useState<string>("");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [startingFen, setStartingFen] = useState<string>(initialFen);

  const resetState = useCallback(() => {
    setMessage("");
    setMoveHistory([]);
  }, []);

  const handleCategorySelect = useCallback(
    (category: C | null) => {
      setSelectedCategory(category);
      setSelectedExercise(null);
      const newFen = category?.exercises[0]?.fen || initialFen;
      setCurrentFen(newFen);
      setStartingFen(newFen);
      resetState();
    },
    [initialFen, resetState],
  );

  const handleExerciseSelect = useCallback(
    (exercise: T) => {
      setSelectedExercise(exercise);
      const newFen = exercise?.fen || initialFen;
      setCurrentFen(newFen);
      setStartingFen(newFen);
      resetState();
    },
    [initialFen, resetState],
  );

  const handleMove = useCallback(
    (orig: string, dest: string, correctMoves: readonly string[], onCorrectMove?: () => void) => {
      if (!selectedExercise || !selectedCategory) return;

      const move = `${orig}${dest}`;
      const newMoveHistory = [...moveHistory, move];
      setMoveHistory(newMoveHistory);

      if (selectedExercise.stepsCount) {
        const evaluation = evaluateCheckmateMoves(startingFen, newMoveHistory, selectedExercise.stepsCount);
        setMessage(evaluation.message);

        if (evaluation.isCheckmate) {
          if (onCorrectMove) {
            onCorrectMove();
          }

          if (completeOnCorrectMove && onExerciseComplete) {
            onExerciseComplete(selectedCategory.id, selectedExercise.id, evaluation);
          }
        }
      } else {
        const isCorrect = correctMoves.includes(move);

        if (isCorrect) {
          setMessage("Correct!");

          if (onCorrectMove) {
            onCorrectMove();
          }

          if (completeOnCorrectMove && onExerciseComplete) {
            const evaluation: MoveEvaluation = {
              type: "optimal",
              moveCount: newMoveHistory.length,
              isCheckmate: false,
              message: "Correct!",
            };
            onExerciseComplete(selectedCategory.id, selectedExercise.id, evaluation);
          }
        } else {
          setMessage("Incorrect. Try again.");
        }
      }
    },
    [selectedCategory, selectedExercise, onExerciseComplete, completeOnCorrectMove, moveHistory, startingFen],
  );

  const resetExercise = useCallback(() => {
    if (selectedExercise?.fen) {
      setCurrentFen(selectedExercise.fen);
      setStartingFen(selectedExercise.fen);
    }
    resetState();
  }, [selectedExercise, resetState]);

  const clearSelection = useCallback(() => {
    setSelectedCategory(null);
    setSelectedExercise(null);
    setCurrentFen(initialFen);
    setStartingFen(initialFen);
    resetState();
  }, [initialFen, resetState]);

  return {
    selectedCategory,
    selectedExercise,
    currentFen,
    message,
    moveHistory,

    setCurrentFen,
    handleCategorySelect,
    handleExerciseSelect,
    handleMove,
    clearSelection,
    resetState,
    resetExercise,
  };
}
