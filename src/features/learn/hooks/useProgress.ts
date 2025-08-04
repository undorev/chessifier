import { useCallback, useState } from "react";

export interface ProgressData {
  completed: boolean;
  exercisesCompleted: string[];
  lastAccessed: string;
}

interface UseProgressOptions {
  prefix: string;
  calculateOverallProgress?: (allProgress: Record<string, ProgressData>) => number;
}

export function useProgress({ prefix, calculateOverallProgress }: UseProgressOptions) {
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [overallProgress, setOverallProgress] = useState<number>(0);

  const getProgress = useCallback(
    (itemId: string): ProgressData => {
      const storageKey = `${prefix}_${itemId}`;
      const storedProgress = localStorage.getItem(storageKey);

      if (storedProgress) {
        return JSON.parse(storedProgress);
      }

      return {
        completed: false,
        exercisesCompleted: [],
        lastAccessed: new Date().toISOString(),
      };
    },
    [prefix],
  );

  const saveProgress = useCallback(
    (itemId: string, data: ProgressData) => {
      const storageKey = `${prefix}_${itemId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));

      setProgress((prev) => ({
        ...prev,
        [itemId]: data,
      }));

      if (calculateOverallProgress) {
        const updatedProgress = {
          ...progress,
          [itemId]: data,
        };
        setOverallProgress(calculateOverallProgress(updatedProgress));
      }
    },
    [prefix, progress, calculateOverallProgress],
  );

  const updateExerciseCompletion = useCallback(
    (itemId: string, exerciseId: string, totalExercises: number, onComplete?: (itemId: string) => void) => {
      const currentProgress = getProgress(itemId);

      if (currentProgress.exercisesCompleted.includes(exerciseId)) {
        return false;
      }

      const updatedProgress = {
        ...currentProgress,
        exercisesCompleted: [...currentProgress.exercisesCompleted, exerciseId],
      };

      if (updatedProgress.exercisesCompleted.length === totalExercises) {
        updatedProgress.completed = true;

        if (onComplete) {
          onComplete(itemId);
        }
      }

      saveProgress(itemId, updatedProgress);
      return true;
    },
    [getProgress, saveProgress],
  );

  const loadAllProgress = useCallback(
    (itemIds: string[]) => {
      const allProgress: Record<string, ProgressData> = {};

      itemIds.forEach((id) => {
        allProgress[id] = getProgress(id);
      });

      setProgress(allProgress);

      if (calculateOverallProgress) {
        setOverallProgress(calculateOverallProgress(allProgress));
      }
    },
    [getProgress, calculateOverallProgress],
  );

  const resetAllProgress = useCallback(
    (itemIds: string[]) => {
      itemIds.forEach((id) => {
        localStorage.removeItem(`${prefix}_${id}`);
      });

      loadAllProgress(itemIds);
    },
    [prefix, loadAllProgress],
  );

  return {
    progress,
    overallProgress,
    getProgress,
    saveProgress,
    updateExerciseCompletion,
    loadAllProgress,
    resetAllProgress,
  };
}
