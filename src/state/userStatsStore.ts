import { create } from "zustand";
import { lessons } from "../features/learn/constants/lessons";
import { practiceCategories } from "../features/learn/constants/practiceCategories";

export interface UserStats {
  lessonsCompleted: number;
  totalLessons: number;
  practiceCompleted: number;
  totalPractice: number;
  currentStreak: number;
  totalPoints: number;
  completionDates: string[];
}

interface UserStatsState {
  userStats: UserStats;
  setUserStats: (stats: Partial<UserStats>) => void;
}

export const useUserStatsStore = create<UserStatsState>((set) => ({
  userStats: {
    lessonsCompleted: 0,
    totalLessons: lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0),
    practiceCompleted: 0,
    totalPractice: practiceCategories.reduce((sum, cat) => sum + cat.exercises.length, 0),
    currentStreak: 0,
    totalPoints: 0,
    completionDates: [],
  },
  setUserStats: (stats) =>
    set((state) => ({
      userStats: { ...state.userStats, ...stats },
    })),
}));
