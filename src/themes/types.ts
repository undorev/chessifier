/**
 * VS Code-style theme system type definitions
 */

export interface ThemeColors {
  // Editor colors
  "editor.background": string;
  "editor.foreground": string;
  "editor.selectionBackground": string;
  "editor.lineHighlightBackground": string;
  "editor.cursorForeground": string;

  // UI colors
  "button.background": string;
  "button.foreground": string;
  "button.hoverBackground": string;
  "button.border": string;

  "input.background": string;
  "input.foreground": string;
  "input.border": string;
  "input.focusBorder": string;

  "dropdown.background": string;
  "dropdown.foreground": string;
  "dropdown.border": string;

  "panel.background": string;
  "panel.border": string;

  "sidebar.background": string;
  "sidebar.foreground": string;
  "sidebar.border": string;

  "tab.activeBackground": string;
  "tab.activeForeground": string;
  "tab.inactiveBackground": string;
  "tab.inactiveForeground": string;
  "tab.border": string;
  "tab.hoverBackground": string;

  "list.activeSelectionBackground": string;
  "list.activeSelectionForeground": string;
  "list.inactiveSelectionBackground": string;
  "list.hoverBackground": string;

  "notification.background": string;
  "notification.foreground": string;
  "notification.border": string;

  "badge.background": string;
  "badge.foreground": string;

  "progress.background": string;
  "progress.foreground": string;

  "scrollbar.shadow": string;
  "scrollbar.thumb": string;
  "scrollbar.thumbHover": string;

  // Chess-specific colors
  "board.lightSquare": string;
  "board.darkSquare": string;
  "board.selectedSquare": string;
  "board.lastMoveSquare": string;
  "board.checkSquare": string;
  "board.coordinate": string;

  "piece.shadow": string;

  "analysis.bestMove": string;
  "analysis.goodMove": string;
  "analysis.inaccuracy": string;
  "analysis.mistake": string;
  "analysis.blunder": string;

  // Status colors
  "status.info": string;
  "status.warning": string;
  "status.error": string;
  "status.success": string;

  // Text colors
  "text.primary": string;
  "text.secondary": string;
  "text.disabled": string;
  "text.link": string;

  // Border colors
  "border.primary": string;
  "border.secondary": string;
  "border.focus": string;

  // Shadow colors
  "shadow.primary": string;
  "shadow.secondary": string;
}

export interface ThemeSyntax {
  "syntax.comment": string;
  "syntax.keyword": string;
  "syntax.string": string;
  "syntax.number": string;
  "syntax.function": string;
  "syntax.variable": string;
  "syntax.operator": string;
  "syntax.punctuation": string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeBorderRadius {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeDefinition {
  name: string;
  displayName: string;
  type: "light" | "dark";
  description?: string;
  author?: string;
  version?: string;
  colors: ThemeColors;
  syntax?: Partial<ThemeSyntax>;
  typography?: Partial<ThemeTypography>;
  spacing?: Partial<ThemeSpacing>;
  borderRadius?: Partial<ThemeBorderRadius>;
  extends?: string;
}

export interface ThemeRegistry {
  themes: Record<string, ThemeDefinition>;
  defaultTheme: string;
  activeTheme: string;
}

export type ThemeType = "light" | "dark";

export interface ThemePreferences {
  activeTheme: string;
  autoDetectSystemTheme: boolean;
  customThemes: Record<string, ThemeDefinition>;
}
