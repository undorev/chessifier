import type { ThemeDefinition } from "./types";

export function generateThemeCSS(theme: ThemeDefinition): string {
  const cssVars: string[] = [];

  Object.entries(theme.colors).forEach(([key, value]) => {
    cssVars.push(`  --theme-${key.replace(/\./g, "-")}: ${value};`);
  });

  if (theme.typography) {
    Object.entries(theme.typography).forEach(([key, value]) => {
      cssVars.push(`  --theme-typography-${key}: ${value};`);
    });
  }

  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      cssVars.push(`  --theme-spacing-${key}: ${value};`);
    });
  }

  if (theme.borderRadius) {
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      cssVars.push(`  --theme-radius-${key}: ${value};`);
    });
  }

  if (theme.syntax) {
    Object.entries(theme.syntax).forEach(([key, value]) => {
      cssVars.push(`  --theme-syntax-${key.replace(/\./g, "-")}: ${value};`);
    });
  }

  return `:root {\n${cssVars.join("\n")}\n}`;
}

export function applyTheme(theme: ThemeDefinition): void {
  const styleId = "pawn-appetit-theme-variables";

  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = generateThemeCSS(theme);

  document.head.insertBefore(style, document.head.firstChild);

  document.documentElement.setAttribute("data-theme", theme.name);
  document.documentElement.setAttribute("data-theme-type", theme.type);
}

export function getCurrentThemeFromDOM(): string | null {
  return document.documentElement.getAttribute("data-theme");
}

export function getCurrentThemeTypeFromDOM(): string | null {
  return document.documentElement.getAttribute("data-theme-type");
}

export function getThemeColor(colorKey: keyof ThemeDefinition["colors"]): string {
  return `var(--theme-${colorKey.replace(/\./g, "-")})`;
}

export function getThemeTypography(key: string): string {
  return `var(--theme-typography-${key})`;
}

export function getThemeSpacing(key: string): string {
  return `var(--theme-spacing-${key})`;
}

export function getThemeRadius(key: string): string {
  return `var(--theme-radius-${key})`;
}

export function getThemeSyntax(key: string): string {
  return `var(--theme-syntax-${key.replace(/\./g, "-")})`;
}

export function adaptiveThemeStyle(lightValue: string, darkValue: string, contrastValue?: string): string {
  if (contrastValue) {
    return `
      ${lightValue};
      [data-theme-type="dark"] & { ${darkValue}; }
    `.trim();
  }
  return `
    ${lightValue};
    [data-theme-type="dark"] & { ${darkValue}; }
  `.trim();
}

export function responsiveThemeStyles(styles: {
  light?: Record<string, string>;
  dark?: Record<string, string>;
}): Record<string, string> {
  const result: Record<string, string> = {};

  if (styles.light) {
    Object.assign(result, styles.light);
  }

  if (styles.dark) {
    Object.entries(styles.dark).forEach(([property, value]) => {
      result[`[data-theme-type="dark"] & ${property}`] = value;
    });
  }

  return result;
}

export const themeVars = {
  colors: {
    background: getThemeColor("editor.background"),
    foreground: getThemeColor("editor.foreground"),
    primary: getThemeColor("button.background"),
    secondary: getThemeColor("panel.background"),
    border: getThemeColor("border.primary"),
    text: getThemeColor("text.primary"),
    textSecondary: getThemeColor("text.secondary"),
    textDisabled: getThemeColor("text.disabled"),
  },

  typography: {
    fontFamily: getThemeTypography("fontFamily"),
    fontSize: getThemeTypography("fontSize"),
    fontWeight: getThemeTypography("fontWeight"),
    lineHeight: getThemeTypography("lineHeight"),
    letterSpacing: getThemeTypography("letterSpacing"),
  },

  spacing: {
    xs: getThemeSpacing("xs"),
    sm: getThemeSpacing("sm"),
    md: getThemeSpacing("md"),
    lg: getThemeSpacing("lg"),
    xl: getThemeSpacing("xl"),
  },

  radius: {
    xs: getThemeRadius("xs"),
    sm: getThemeRadius("sm"),
    md: getThemeRadius("md"),
    lg: getThemeRadius("lg"),
    xl: getThemeRadius("xl"),
  },

  chess: {
    lightSquare: getThemeColor("board.lightSquare"),
    darkSquare: getThemeColor("board.darkSquare"),
    selectedSquare: getThemeColor("board.selectedSquare"),
    lastMoveSquare: getThemeColor("board.lastMoveSquare"),
    checkSquare: getThemeColor("board.checkSquare"),
    coordinate: getThemeColor("board.coordinate"),
  },
};
