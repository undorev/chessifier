import { Button, Code, Stack, Text } from "@mantine/core";
import { useTheme, useThemeCustomization } from "../hooks";

export function ThemeDebugger() {
  const { availableThemes, currentTheme } = useTheme();
  const { importTheme } = useThemeCustomization();

  const testImport = async () => {
    try {
      const testTheme = {
        name: "debug-test",
        displayName: "Debug Test Theme",
        type: "light" as const,
        description: "A test theme for debugging",
        colors: {
          "editor.background": "#f0f0f0",
          "editor.foreground": "#333333",
          "editor.selectionBackground": "#007acc20",
          "editor.lineHighlightBackground": "#f5f5f5",
          "editor.cursorForeground": "#333333",
          "button.background": "#007acc",
          "button.foreground": "#ffffff",
          "button.hoverBackground": "#005a9e",
          "button.border": "#007acc",
          "input.background": "#ffffff",
          "input.foreground": "#333333",
          "input.border": "#cccccc",
          "input.focusBorder": "#007acc",
          "dropdown.background": "#ffffff",
          "dropdown.foreground": "#333333",
          "dropdown.border": "#cccccc",
          "panel.background": "#f8f8f8",
          "panel.border": "#cccccc",
          "sidebar.background": "#f8f8f8",
          "sidebar.foreground": "#333333",
          "sidebar.border": "#cccccc",
          "tab.activeBackground": "#ffffff",
          "tab.activeForeground": "#333333",
          "tab.inactiveBackground": "#f8f8f8",
          "tab.inactiveForeground": "#666666",
          "tab.border": "#cccccc",
          "tab.hoverBackground": "#ffffff",
          "list.activeSelectionBackground": "#007acc",
          "list.activeSelectionForeground": "#ffffff",
          "list.inactiveSelectionBackground": "#007acc20",
          "list.hoverBackground": "#f5f5f5",
          "notification.background": "#ffffff",
          "notification.foreground": "#333333",
          "notification.border": "#cccccc",
          "badge.background": "#007acc",
          "badge.foreground": "#ffffff",
          "progress.background": "#cccccc",
          "progress.foreground": "#007acc",
          "scrollbar.shadow": "rgba(0, 0, 0, 0.1)",
          "scrollbar.thumb": "#cccccc",
          "scrollbar.thumbHover": "#999999",
          "board.lightSquare": "#f0d9b5",
          "board.darkSquare": "#b58863",
          "board.selectedSquare": "#007acc",
          "board.lastMoveSquare": "#ffeb3b",
          "board.checkSquare": "#f44336",
          "board.coordinate": "#8b7355",
          "piece.shadow": "rgba(0, 0, 0, 0.3)",
          "analysis.bestMove": "#4caf50",
          "analysis.goodMove": "#2196f3",
          "analysis.inaccuracy": "#ff9800",
          "analysis.mistake": "#ff5722",
          "analysis.blunder": "#f44336",
          "status.info": "#2196f3",
          "status.warning": "#ff9800",
          "status.error": "#f44336",
          "status.success": "#4caf50",
          "text.primary": "#333333",
          "text.secondary": "#666666",
          "text.disabled": "#999999",
          "text.link": "#007acc",
          "border.primary": "#cccccc",
          "border.secondary": "#e0e0e0",
          "border.focus": "#007acc",
          "shadow.primary": "rgba(0, 0, 0, 0.1)",
          "shadow.secondary": "rgba(0, 0, 0, 0.05)",
        },
      };

      console.log("Testing theme import...");
      const result = await importTheme(JSON.stringify(testTheme));
      console.log("Import result:", result);
    } catch (error) {
      console.error("Import test failed:", error);
    }
  };

  return (
    <Stack gap="md" p="md" style={{ border: "1px solid #ccc", borderRadius: "8px" }}>
      <Text fw={600}>Theme Debug Info</Text>

      <div>
        <Text size="sm" fw={500}>
          Current Theme:
        </Text>
        <Code>{currentTheme?.name || "None"}</Code>
      </div>

      <div>
        <Text size="sm" fw={500}>
          Available Themes ({availableThemes.length}):
        </Text>
        <Code block>
          {availableThemes.map((t) => `${t.name} (${t.type}${t.isCustom ? ", custom" : ""})`).join("\n")}
        </Code>
      </div>

      <Button onClick={testImport} size="sm">
        Test Import
      </Button>
    </Stack>
  );
}

export default ThemeDebugger;
