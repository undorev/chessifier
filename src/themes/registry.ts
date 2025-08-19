import { classicDarkTheme } from "./classic-dark";
import { classicLightTheme } from "./classic-light";
import type { ThemeDefinition, ThemeRegistry, ThemeType } from "./types";

export const builtInThemes: Record<string, ThemeDefinition> = {
  [classicLightTheme.name]: classicLightTheme,
  [classicDarkTheme.name]: classicDarkTheme,
};

export const defaultThemeRegistry: ThemeRegistry = {
  themes: builtInThemes,
  defaultTheme: classicLightTheme.name,
  activeTheme: classicLightTheme.name,
};

export class ThemeManager {
  private registry: ThemeRegistry;
  private customThemes: Record<string, ThemeDefinition> = {};

  constructor(registry: ThemeRegistry = defaultThemeRegistry) {
    this.registry = registry;
  }

  getAllThemes(): Record<string, ThemeDefinition> {
    return {
      ...this.registry.themes,
      ...this.customThemes,
    };
  }

  getTheme(name: string): ThemeDefinition | null {
    return this.getAllThemes()[name] || null;
  }

  getThemeByUuid(uuid: string): ThemeDefinition | null {
    return Object.values(this.getAllThemes()).find((theme) => theme.uuid === uuid) || null;
  }

  getThemesByType(type: ThemeType): ThemeDefinition[] {
    return Object.values(this.getAllThemes()).filter((theme) => theme.type === type);
  }

  getActiveTheme(): ThemeDefinition | null {
    return this.getTheme(this.registry.activeTheme);
  }

  setActiveTheme(themeName: string): boolean {
    if (this.getTheme(themeName)) {
      this.registry.activeTheme = themeName;
      return true;
    }
    return false;
  }

  registerTheme(theme: ThemeDefinition): void {
    if (!theme.name || !theme.colors || !theme.uuid) {
      throw new Error("Theme must have a name, uuid, and colors");
    }

    this.customThemes[theme.name] = theme;
  }

  removeTheme(themeName: string): boolean {
    if (this.customThemes[themeName]) {
      delete this.customThemes[themeName];

      if (this.registry.activeTheme === themeName) {
        this.registry.activeTheme = this.registry.defaultTheme;
      }

      return true;
    }
    return false;
  }

  loadThemeFromJSON(jsonString: string): ThemeDefinition {
    try {
      const themeData = JSON.parse(jsonString);
      return this.validateAndNormalizeTheme(themeData);
    } catch (error) {
      throw new Error(`Failed to parse theme JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  exportThemeToJSON(themeName: string): string | null {
    const theme = this.getTheme(themeName);
    if (!theme) return null;

    return JSON.stringify(theme, null, 2);
  }

  private validateAndNormalizeTheme(themeData: unknown): ThemeDefinition {
    const data = themeData as Record<string, unknown>;

    if (!data.name || typeof data.name !== "string") {
      throw new Error("Theme must have a valid name");
    }

    if (!data.colors || typeof data.colors !== "object") {
      throw new Error("Theme must have a colors object");
    }

    const uuid = (data.uuid as string) || this.generateUUID();

    const normalizedTheme: ThemeDefinition = {
      uuid,
      name: data.name,
      displayName: (data.displayName as string) || data.name,
      type: (data.type as ThemeType) || "light",
      description: data.description as string,
      author: data.author as string,
      version: (data.version as string) || "1.0.0",
      colors: data.colors as ThemeDefinition["colors"],
      syntax: data.syntax as ThemeDefinition["syntax"],
      typography: data.typography as ThemeDefinition["typography"],
      spacing: data.spacing as ThemeDefinition["spacing"],
      borderRadius: data.borderRadius as ThemeDefinition["borderRadius"],
      extends: data.extends as string,
    };

    if (normalizedTheme.extends) {
      const baseTheme = this.getTheme(normalizedTheme.extends);
      if (baseTheme) {
        normalizedTheme.colors = {
          ...baseTheme.colors,
          ...normalizedTheme.colors,
        };

        if (!normalizedTheme.typography && baseTheme.typography) {
          normalizedTheme.typography = baseTheme.typography;
        }

        if (!normalizedTheme.spacing && baseTheme.spacing) {
          normalizedTheme.spacing = baseTheme.spacing;
        }

        if (!normalizedTheme.borderRadius && baseTheme.borderRadius) {
          normalizedTheme.borderRadius = baseTheme.borderRadius;
        }
      }
    }

    return normalizedTheme;
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getThemeMetadata(): Array<{
    uuid: string;
    name: string;
    displayName: string;
    type: ThemeType;
    description?: string;
    author?: string;
    isCustom: boolean;
  }> {
    const allThemes = this.getAllThemes();

    return Object.values(allThemes).map((theme) => ({
      uuid: theme.uuid,
      name: theme.name,
      displayName: theme.displayName,
      type: theme.type,
      description: theme.description,
      author: theme.author,
      isCustom: !this.registry.themes[theme.name],
    }));
  }

  hasTheme(themeName: string): boolean {
    return !!this.getTheme(themeName);
  }

  getDefaultThemeForType(type: ThemeType): ThemeDefinition | null {
    const themesOfType = this.getThemesByType(type);
    return themesOfType.length > 0 ? themesOfType[0] : null;
  }
}

export const themeManager = new ThemeManager();
