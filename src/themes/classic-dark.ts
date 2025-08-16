import type { ThemeDefinition } from "./types";

export const classicDarkTheme: ThemeDefinition = {
  name: "classic-dark",
  displayName: "Classic Dark",
  type: "dark",
  description: "A comfortable dark theme perfect for nighttime coding",
  author: "Chessifier Team",
  version: "1.0.0",
  colors: {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "editor.selectionBackground": "#264f78",
    "editor.lineHighlightBackground": "#2a2d2e",
    "editor.cursorForeground": "#ffffff",

    "button.background": "#0e639c",
    "button.foreground": "#ffffff",
    "button.hoverBackground": "#1177bb",
    "button.border": "#0e639c",

    "input.background": "#3c3c3c",
    "input.foreground": "#d4d4d4",
    "input.border": "#5a5a5a",
    "input.focusBorder": "#007acc",

    "dropdown.background": "#3c3c3c",
    "dropdown.foreground": "#d4d4d4",
    "dropdown.border": "#5a5a5a",

    "panel.background": "#252526",
    "panel.border": "#2d2d30",

    "sidebar.background": "#2d2d30",
    "sidebar.foreground": "#cccccc",
    "sidebar.border": "#2d2d30",

    "tab.activeBackground": "#1e1e1e",
    "tab.activeForeground": "#ffffff",
    "tab.inactiveBackground": "#2d2d30",
    "tab.inactiveForeground": "#969696",
    "tab.border": "#2d2d30",
    "tab.hoverBackground": "#1e1e1e",

    "list.activeSelectionBackground": "#094771",
    "list.activeSelectionForeground": "#ffffff",
    "list.inactiveSelectionBackground": "#37373d",
    "list.hoverBackground": "#2a2d2e",

    "notification.background": "#3c3c3c",
    "notification.foreground": "#d4d4d4",
    "notification.border": "#5a5a5a",

    "badge.background": "#007acc",
    "badge.foreground": "#ffffff",

    "progress.background": "#5a5a5a",
    "progress.foreground": "#007acc",

    "scrollbar.shadow": "rgba(0, 0, 0, 0.3)",
    "scrollbar.thumb": "#424242",
    "scrollbar.thumbHover": "#4f4f4f",

    "board.lightSquare": "#f0d9b5",
    "board.darkSquare": "#b58863",
    "board.selectedSquare": "#68a8d8",
    "board.lastMoveSquare": "#cdd26a",
    "board.checkSquare": "#ff6b6b",
    "board.coordinate": "#8b7355",

    "piece.shadow": "rgba(0, 0, 0, 0.5)",

    "analysis.bestMove": "#22c55e",
    "analysis.goodMove": "#3b82f6",
    "analysis.inaccuracy": "#fbbf24",
    "analysis.mistake": "#fb923c",
    "analysis.blunder": "#ef4444",

    "status.info": "#007acc",
    "status.warning": "#fbbf24",
    "status.error": "#ef4444",
    "status.success": "#22c55e",

    "text.primary": "#d4d4d4",
    "text.secondary": "#969696",
    "text.disabled": "#6a6a6a",
    "text.link": "#3794ff",

    "border.primary": "#2d2d30",
    "border.secondary": "#3c3c3c",
    "border.focus": "#007acc",

    "shadow.primary": "rgba(0, 0, 0, 0.3)",
    "shadow.secondary": "rgba(0, 0, 0, 0.15)",
  },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: "14px",
    fontWeight: "400",
    lineHeight: "1.5",
    letterSpacing: "0",
  },
  spacing: {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "32px",
  },
  borderRadius: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "16px",
    xl: "32px",
  },
};
