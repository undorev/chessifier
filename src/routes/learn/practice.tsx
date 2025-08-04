import { createFileRoute } from "@tanstack/react-router";
import PracticePage from "@/features/learn/PracticePage";

export const Route = createFileRoute("/learn/practice")({
  component: PracticePage,
});
