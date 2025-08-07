import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { lessons } from "../features/learn/constants/lessons";
import { practiceCategories } from "../features/learn/constants/practiceCategories";

export interface UserStats {
  lessonsCompleted: number;
  totalLessons: number;
  practiceCompleted: number;
  totalPractice: number;
  totalPoints: number;
  completionDates: string[];
  completedExercises: { [lessonId: string]: string[] };
  completedPractice: { [categoryId: string]: string[] };
}

interface UserStatsState {
  userStats: UserStats;
  setUserStats: (stats: Partial<UserStats>) => void;
}

export const useUserStatsStore = create<UserStatsState>()(
  persist(
    (set) => ({
      userStats: {
        lessonsCompleted: 0,
        totalLessons: lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0),
        practiceCompleted: 0,
        totalPractice: practiceCategories.reduce((sum, cat) => sum + cat.exercises.length, 0),
        totalPoints: 0,
        completionDates: [],
        completedExercises: {},
        completedPractice: {},
      },
      setUserStats: (stats) =>
        set((state) => {
          const updatedStats = { ...state.userStats, ...stats };

          const addCompletionDate = () => {
            const today = new Date().toISOString();
            if (!updatedStats.completionDates.includes(today)) {
              updatedStats.completionDates.push(today);
            }
          };

          if (stats.completedExercises) {
            Object.entries(stats.completedExercises).forEach(([_, exercises]) => {
              exercises.forEach(() => addCompletionDate());
            });
          }

          if (stats.completedPractice) {
            Object.entries(stats.completedPractice).forEach(([_, exercises]) => {
              exercises.forEach(() => addCompletionDate());
            });
          }

          return { userStats: updatedStats };
        }),
    }),
    {
      name: "user-stats-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
