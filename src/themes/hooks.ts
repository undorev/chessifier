import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { applyTheme } from "./css";
import { themeManager } from "./registry";
import {
  addCustomThemeAtom,
  availableThemesAtom,
  computedThemeAtom,
  importThemeFromJSONAtom,
  initializeThemesAtom,
  removeCustomThemeAtom,
  setThemeAtom,
  themePreferencesWithRegistrationAtom,
  toggleAutoDetectionAtom,
  updateCustomThemeAtom,
} from "./state";
import type { ThemeDefinition, ThemePreferences, ThemeType } from "./types";

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function useTheme() {
  const computedTheme = useAtomValue(computedThemeAtom);
  const preferences = useAtomValue(themePreferencesWithRegistrationAtom);
  const setTheme = useSetAtom(setThemeAtom);
  const addCustomTheme = useSetAtom(addCustomThemeAtom);
  const removeCustomTheme = useSetAtom(removeCustomThemeAtom);
  const toggleAutoDetection = useSetAtom(toggleAutoDetectionAtom);
  const importThemeFromJSON = useSetAtom(importThemeFromJSONAtom);
  const availableThemes = useAtomValue(availableThemesAtom);
  const initialize = useSetAtom(initializeThemesAtom);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (computedTheme) {
      applyTheme(computedTheme);
    }
  }, [computedTheme]);

  const exportThemeToJSON = useCallback((themeName: string) => {
    return themeManager.exportThemeToJSON(themeName);
  }, []);

  const getTheme = useCallback((themeName: string) => {
    return themeManager.getTheme(themeName);
  }, []);

  const getThemesByType = useCallback((type: ThemeType) => {
    return themeManager.getThemesByType(type);
  }, []);

  return {
    currentTheme: computedTheme,
    activeThemeName: preferences.activeTheme,
    autoDetectEnabled: preferences.autoDetectSystemTheme,

    availableThemes,

    setTheme,
    addCustomTheme,
    removeCustomTheme,
    toggleAutoDetection,
    importThemeFromJSON,
    exportThemeToJSON,
    getTheme,
    getThemesByType,
  };
}

export function useThemeSwitcher() {
  const { setTheme, availableThemes, currentTheme } = useTheme();

  const switchToNext = useCallback(() => {
    const themes = availableThemes;
    const currentIndex = themes.findIndex((t) => t.name === currentTheme?.name);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].name);
  }, [availableThemes, currentTheme, setTheme]);

  const switchToPrevious = useCallback(() => {
    const themes = availableThemes;
    const currentIndex = themes.findIndex((t) => t.name === currentTheme?.name);
    const prevIndex = currentIndex === 0 ? themes.length - 1 : currentIndex - 1;
    setTheme(themes[prevIndex].name);
  }, [availableThemes, currentTheme, setTheme]);

  const switchToType = useCallback(
    (type: ThemeType) => {
      const themesOfType = availableThemes.filter((t) => t.type === type);
      if (themesOfType.length > 0) {
        setTheme(themesOfType[0].name);
      }
    },
    [availableThemes, setTheme],
  );

  return {
    switchToNext,
    switchToPrevious,
    switchToType,
    setTheme,
  };
}

export function useThemeCustomization() {
  const preferences = useAtomValue(themePreferencesWithRegistrationAtom);
  const addCustomTheme = useSetAtom(addCustomThemeAtom);
  const updateCustomTheme = useSetAtom(updateCustomThemeAtom);
  const removeCustomTheme = useSetAtom(removeCustomThemeAtom);

  const createCustomTheme = useCallback(
    (baseTheme: ThemeDefinition, modifications: Partial<ThemeDefinition>): ThemeDefinition => {
      return {
        ...baseTheme,
        ...modifications,
        uuid: modifications.uuid || generateUUID(),
        name: modifications.name || `custom-${Date.now()}`,
        displayName: modifications.displayName || `Custom ${baseTheme.displayName}`,
        colors: {
          ...baseTheme.colors,
          ...modifications.colors,
        },
        typography: modifications.typography
          ? {
              ...baseTheme.typography,
              ...modifications.typography,
            }
          : baseTheme.typography,
        spacing: modifications.spacing
          ? {
              ...baseTheme.spacing,
              ...modifications.spacing,
            }
          : baseTheme.spacing,
        borderRadius: modifications.borderRadius
          ? {
              ...baseTheme.borderRadius,
              ...modifications.borderRadius,
            }
          : baseTheme.borderRadius,
      };
    },
    [],
  );

  const saveCustomTheme = useCallback(
    (theme: ThemeDefinition) => {
      addCustomTheme(theme);
    },
    [addCustomTheme],
  );

  const saveOrUpdateCustomTheme = useCallback(
    (theme: ThemeDefinition, isEditing = false) => {
      const existingTheme = Object.values(preferences.customThemes).find((t) => t.uuid === theme.uuid);
      const shouldUpdate = isEditing && !!existingTheme;

      if (shouldUpdate) {
        updateCustomTheme(theme);
      } else {
        addCustomTheme(theme);
      }
    },
    [addCustomTheme, updateCustomTheme, preferences.customThemes],
  );

  const deleteCustomTheme = useCallback(
    (themeUuid: string) => {
      removeCustomTheme(themeUuid);
    },
    [removeCustomTheme],
  );

  const duplicateTheme = useCallback(
    (themeName: string, newName?: string) => {
      const theme = themeManager.getTheme(themeName);
      if (theme) {
        const duplicated = createCustomTheme(theme, {
          uuid: generateUUID(),
          name: newName || `${theme.name}-copy`,
          displayName: `${theme.displayName} Copy`,
        });
        saveCustomTheme(duplicated);
        return duplicated;
      }
      return null;
    },
    [createCustomTheme, saveCustomTheme],
  );

  const exportTheme = useCallback((themeName: string) => {
    return themeManager.exportThemeToJSON(themeName);
  }, []);

  const importTheme = useSetAtom(importThemeFromJSONAtom);

  return {
    customThemes: preferences.customThemes,
    createCustomTheme,
    saveCustomTheme,
    saveOrUpdateCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
    importTheme,
    exportTheme,
  };
}

export function useThemeDetection() {
  const [preferences, setPreferences] = useAtom(themePreferencesWithRegistrationAtom);

  const toggleAutoDetection = useCallback(() => {
    setPreferences((prev: ThemePreferences) => ({
      ...prev,
      autoDetectSystemTheme: !prev.autoDetectSystemTheme,
    }));
  }, [setPreferences]);

  const enableAutoDetection = useCallback(() => {
    setPreferences((prev: ThemePreferences) => ({
      ...prev,
      autoDetectSystemTheme: true,
    }));
  }, [setPreferences]);

  const disableAutoDetection = useCallback(() => {
    setPreferences((prev: ThemePreferences) => ({
      ...prev,
      autoDetectSystemTheme: false,
    }));
  }, [setPreferences]);

  return {
    autoDetectEnabled: preferences.autoDetectSystemTheme,
    toggleAutoDetection,
    enableAutoDetection,
    disableAutoDetection,
  };
}

export function useThemeValues() {
  const theme = useAtomValue(computedThemeAtom);

  const getColor = useCallback(
    (colorKey: keyof ThemeDefinition["colors"]) => {
      return theme?.colors[colorKey];
    },
    [theme],
  );

  const getTypography = useCallback(
    (key: keyof NonNullable<ThemeDefinition["typography"]>) => {
      return theme?.typography?.[key];
    },
    [theme],
  );

  const getSpacing = useCallback(
    (key: keyof NonNullable<ThemeDefinition["spacing"]>) => {
      return theme?.spacing?.[key];
    },
    [theme],
  );

  const getRadius = useCallback(
    (key: keyof NonNullable<ThemeDefinition["borderRadius"]>) => {
      return theme?.borderRadius?.[key];
    },
    [theme],
  );

  return {
    theme,
    getColor,
    getTypography,
    getSpacing,
    getRadius,
  };
}

export function useThemePersistence() {
  const preferences = useAtomValue(themePreferencesWithRegistrationAtom);
  const addCustomTheme = useSetAtom(addCustomThemeAtom);

  const exportAllThemes = useCallback(() => {
    const allThemes = {
      preferences,
      customThemes: preferences.customThemes,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(allThemes, null, 2);
  }, [preferences]);

  const importAllThemes = useCallback(
    (jsonString: string) => {
      try {
        const data = JSON.parse(jsonString);

        if (data.customThemes) {
          Object.values(data.customThemes as Record<string, ThemeDefinition>).forEach((theme) => {
            addCustomTheme(theme);
          });
        }

        return true;
      } catch (error) {
        console.error("Failed to import themes:", error);
        return false;
      }
    },
    [addCustomTheme],
  );

  const exportTheme = useCallback((themeName: string) => {
    return themeManager.exportThemeToJSON(themeName);
  }, []);

  const importTheme = useSetAtom(importThemeFromJSONAtom);

  return {
    exportAllThemes,
    importAllThemes,
    exportTheme,
    importTheme,
  };
}
