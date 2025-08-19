import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { defaultThemeRegistry, themeManager } from "./registry";
import type { ThemeDefinition, ThemePreferences } from "./types";

export const themePreferencesAtom = atomWithStorage<ThemePreferences>("theme-preferences", {
  activeTheme: "classic-light",
  autoDetectSystemTheme: true,
  customThemes: {},
});

export const themePreferencesWithRegistrationAtom = atom(
  (get) => {
    const preferences = get(themePreferencesAtom);

    Object.values(preferences.customThemes).forEach((theme) => {
      if (!themeManager.hasTheme(theme.name)) {
        try {
          themeManager.registerTheme(theme);
        } catch (error) {
          console.warn(`Failed to register custom theme ${theme.name}:`, error);
        }
      }
    });

    return preferences;
  },
  (_get, set, newPreferences: ThemePreferences | ((prev: ThemePreferences) => ThemePreferences)) => {
    set(themePreferencesAtom, newPreferences);
  },
);

export const activeThemeAtom = atom(
  (get) => {
    const preferences = get(themePreferencesWithRegistrationAtom);
    const theme = themeManager.getTheme(preferences.activeTheme);

    if (!theme) {
      return (
        themeManager.getTheme(defaultThemeRegistry.defaultTheme) ||
        themeManager.getAllThemes()[Object.keys(themeManager.getAllThemes())[0]]
      );
    }

    return theme;
  },
  (get, set, newTheme: string | ThemeDefinition) => {
    const themeName = typeof newTheme === "string" ? newTheme : newTheme.name;
    const preferences = get(themePreferencesWithRegistrationAtom);

    if (typeof newTheme === "object") {
      themeManager.registerTheme(newTheme);
      set(themePreferencesWithRegistrationAtom, {
        ...preferences,
        customThemes: {
          ...preferences.customThemes,
          [newTheme.name]: newTheme,
        },
        activeTheme: themeName,
        autoDetectSystemTheme: false,
      });
    } else {
      set(themePreferencesWithRegistrationAtom, {
        ...preferences,
        activeTheme: themeName,
        autoDetectSystemTheme: false,
      });
    }
  },
);

export const systemColorSchemeAtom = atom<"light" | "dark">("light");

export const computedThemeAtom = atom((get) => {
  const preferences = get(themePreferencesWithRegistrationAtom);
  const activeTheme = get(activeThemeAtom);
  const systemScheme = get(systemColorSchemeAtom);

  if (!preferences.autoDetectSystemTheme) {
    return activeTheme;
  }

  const defaultThemes = ["classic-light", "classic-dark"];
  const isDefaultClassicTheme = defaultThemes.includes(activeTheme.name);

  if (isDefaultClassicTheme) {
    const targetTheme = systemScheme === "dark" ? "classic-dark" : "classic-light";
    const theme = themeManager.getTheme(targetTheme);
    if (theme) {
      return theme;
    }
  }

  return activeTheme;
});

export const availableThemesAtom = atom((get) => {
  const preferences = get(themePreferencesWithRegistrationAtom);

  const _ = preferences.customThemes;
  return themeManager.getThemeMetadata();
});

export const setThemeAtom = atom(null, (_get, set, themeName: string) => {
  set(activeThemeAtom, themeName);
});

export const addCustomThemeAtom = atom(null, (get, set, theme: ThemeDefinition) => {
  const preferences = get(themePreferencesWithRegistrationAtom);
  themeManager.registerTheme(theme);

  set(themePreferencesWithRegistrationAtom, {
    ...preferences,
    customThemes: {
      ...preferences.customThemes,
      [theme.uuid]: theme,
    },
    autoDetectSystemTheme: false,
  });
});

export const updateCustomThemeAtom = atom(null, (get, set, theme: ThemeDefinition) => {
  const preferences = get(themePreferencesWithRegistrationAtom);

  const existingTheme = Object.values(preferences.customThemes).find((t) => t.uuid === theme.uuid);

  if (existingTheme) {
    if (existingTheme.name !== theme.name) {
      themeManager.removeTheme(existingTheme.name);
    }

    themeManager.registerTheme(theme);

    set(themePreferencesWithRegistrationAtom, {
      ...preferences,
      customThemes: {
        ...preferences.customThemes,
        [theme.uuid]: theme,
      },
      activeTheme: preferences.activeTheme === existingTheme.name ? theme.name : preferences.activeTheme,
    });
  }
});

export const removeCustomThemeAtom = atom(null, (get, set, themeUuid: string) => {
  const preferences = get(themePreferencesWithRegistrationAtom);
  const themeToRemove = preferences.customThemes[themeUuid];

  if (themeToRemove) {
    themeManager.removeTheme(themeToRemove.name);

    const { [themeUuid]: _, ...remainingThemes } = preferences.customThemes;
    const isLastCustomTheme = Object.keys(remainingThemes).length === 0;
    const wasActiveTheme = preferences.activeTheme === themeToRemove.name;

    set(themePreferencesWithRegistrationAtom, {
      ...preferences,
      customThemes: remainingThemes,
      activeTheme: wasActiveTheme ? defaultThemeRegistry.defaultTheme : preferences.activeTheme,
      autoDetectSystemTheme: wasActiveTheme || isLastCustomTheme ? true : preferences.autoDetectSystemTheme,
    });
  }
});

export const toggleAutoDetectionAtom = atom(null, (get, set) => {
  const preferences = get(themePreferencesWithRegistrationAtom);
  set(themePreferencesWithRegistrationAtom, {
    ...preferences,
    autoDetectSystemTheme: !preferences.autoDetectSystemTheme,
  });
});

export const importThemeFromJSONAtom = atom(null, (get, set, jsonString: string) => {
  const theme = themeManager.loadThemeFromJSON(jsonString);
  const preferences = get(themePreferencesWithRegistrationAtom);

  themeManager.registerTheme(theme);

  set(themePreferencesWithRegistrationAtom, {
    ...preferences,
    customThemes: {
      ...preferences.customThemes,
      [theme.uuid]: theme,
    },
    autoDetectSystemTheme: false,
  });

  return theme;
});

export const initializeThemesAtom = atom(null, (get, set) => {
  const preferences = get(themePreferencesWithRegistrationAtom);

  Object.values(preferences.customThemes).forEach((theme) => {
    try {
      themeManager.registerTheme(theme);
    } catch (error) {
      console.warn(`Failed to register custom theme ${theme.name}:`, error);
    }
  });

  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemScheme = () => {
      set(systemColorSchemeAtom, mediaQuery.matches ? "dark" : "light");
    };

    updateSystemScheme();

    mediaQuery.addEventListener("change", updateSystemScheme);

    return () => {
      mediaQuery.removeEventListener("change", updateSystemScheme);
    };
  }
});
