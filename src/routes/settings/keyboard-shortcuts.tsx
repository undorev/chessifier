import { createFileRoute } from "@tanstack/react-router";
import KeyboardShortcutsPage from "@/components/settings/KeyboardShortcuts";

export const Route = createFileRoute("/settings/keyboard-shortcuts")({
  component: KeyboardShortcutsPage,
});
