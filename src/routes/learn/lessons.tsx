import { createFileRoute } from "@tanstack/react-router";
import LessonsPage from "@/features/learn/LessonsPage";

export const Route = createFileRoute("/learn/lessons")({
  component: LessonsPage,
});
