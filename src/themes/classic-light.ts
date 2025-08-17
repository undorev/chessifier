import type { ThemeDefinition } from "./types";

export const classicLightTheme: ThemeDefinition = {
  name: "classic-light",
  displayName: "Classic Light",
  type: "light",
  description: "A clean, bright theme perfect for daytime coding",
  author: "ChessKitchen Team",
  version: "1.0.0",
  colors: {
    "editor.background": "#ffffff",
    "editor.foreground": "#333333",
    "editor.selectionBackground": "#add6ff",
    "editor.lineHighlightBackground": "#f5f5f5",
    "editor.cursorForeground": "#000000",

    "button.background": "#0078d4",
    "button.foreground": "#ffffff",
    "button.hoverBackground": "#106ebe",
    "button.border": "#0078d4",

    "input.background": "#ffffff",
    "input.foreground": "#333333",
    "input.border": "#d1d1d1",
    "input.focusBorder": "#0078d4",

    "dropdown.background": "#ffffff",
    "dropdown.foreground": "#333333",
    "dropdown.border": "#d1d1d1",

    "panel.background": "#f8f8f8",
    "panel.border": "#e1e1e1",

    "sidebar.background": "#f3f3f3",
    "sidebar.foreground": "#333333",
    "sidebar.border": "#e1e1e1",

    "tab.activeBackground": "#ffffff",
    "tab.activeForeground": "#333333",
    "tab.inactiveBackground": "#ececec",
    "tab.inactiveForeground": "#6a6a6a",
    "tab.border": "#e1e1e1",
    "tab.hoverBackground": "#f0f0f0",

    "list.activeSelectionBackground": "#0078d4",
    "list.activeSelectionForeground": "#ffffff",
    "list.inactiveSelectionBackground": "#e4e6f1",
    "list.hoverBackground": "#f0f0f0",

    "notification.background": "#ffffff",
    "notification.foreground": "#333333",
    "notification.border": "#d1d1d1",

    "badge.background": "#0078d4",
    "badge.foreground": "#ffffff",

    "progress.background": "#e1e1e1",
    "progress.foreground": "#0078d4",

    "scrollbar.shadow": "rgba(0, 0, 0, 0.1)",
    "scrollbar.thumb": "#c1c1c1",
    "scrollbar.thumbHover": "#a6a6a6",

    "board.lightSquare": "#f0d9b5",
    "board.darkSquare": "#b58863",
    "board.selectedSquare": "#68a8d8",
    "board.lastMoveSquare": "#cdd26a",
    "board.checkSquare": "#ff6b6b",
    "board.coordinate": "#8b7355",

    "piece.shadow": "rgba(0, 0, 0, 0.3)",

    "analysis.bestMove": "#15803d",
    "analysis.goodMove": "#3b82f6",
    "analysis.inaccuracy": "#f59e0b",
    "analysis.mistake": "#f97316",
    "analysis.blunder": "#dc2626",

    "status.info": "#0078d4",
    "status.warning": "#f59e0b",
    "status.error": "#dc2626",
    "status.success": "#15803d",

    "text.primary": "#333333",
    "text.secondary": "#6a6a6a",
    "text.disabled": "#a6a6a6",
    "text.link": "#0078d4",

    "border.primary": "#e1e1e1",
    "border.secondary": "#f0f0f0",
    "border.focus": "#0078d4",

    "shadow.primary": "rgba(0, 0, 0, 0.1)",
    "shadow.secondary": "rgba(0, 0, 0, 0.05)",
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
