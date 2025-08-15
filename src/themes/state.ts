import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { defaultThemeRegistry, themeManager } from "./registry";
import type { ThemeDefinition, ThemePreferences } from "./types";

export const themePreferencesAtom = atomWithStorage<ThemePreferences>("theme-preferences", {
  activeTheme: "classic-light",
  autoDetectSystemTheme: true,
  customThemes: {},
});

export const activeThemeAtom = atom(
  (get) => {
    const preferences = get(themePreferencesAtom);
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
    const preferences = get(themePreferencesAtom);

    if (typeof newTheme === "object") {
      themeManager.registerTheme(newTheme);
      set(themePreferencesAtom, {
        ...preferences,
        customThemes: {
          ...preferences.customThemes,
          [newTheme.name]: newTheme,
        },
        activeTheme: themeName,
      });
    } else {
      set(themePreferencesAtom, {
        ...preferences,
        activeTheme: themeName,
      });
    }
  },
);

export const systemColorSchemeAtom = atom<"light" | "dark">("light");

export const computedThemeAtom = atom((get) => {
  const preferences = get(themePreferencesAtom);
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
  const preferences = get(themePreferencesAtom);

  const _ = preferences.customThemes;
  return themeManager.getThemeMetadata();
});

export const setThemeAtom = atom(null, (_get, set, themeName: string) => {
  set(activeThemeAtom, themeName);
});

export const addCustomThemeAtom = atom(null, (get, set, theme: ThemeDefinition) => {
  const preferences = get(themePreferencesAtom);
  themeManager.registerTheme(theme);

  set(themePreferencesAtom, {
    ...preferences,
    customThemes: {
      ...preferences.customThemes,
      [theme.name]: theme,
    },
  });
});

export const removeCustomThemeAtom = atom(null, (get, set, themeName: string) => {
  const preferences = get(themePreferencesAtom);

  if (preferences.customThemes[themeName]) {
    themeManager.removeTheme(themeName);

    const { [themeName]: _, ...remainingThemes } = preferences.customThemes;

    set(themePreferencesAtom, {
      ...preferences,
      customThemes: remainingThemes,

      activeTheme: preferences.activeTheme === themeName ? defaultThemeRegistry.defaultTheme : preferences.activeTheme,
    });
  }
});

export const toggleAutoDetectionAtom = atom(null, (get, set) => {
  const preferences = get(themePreferencesAtom);
  set(themePreferencesAtom, {
    ...preferences,
    autoDetectSystemTheme: !preferences.autoDetectSystemTheme,
  });
});

export const importThemeFromJSONAtom = atom(null, (get, set, jsonString: string) => {
  const theme = themeManager.loadThemeFromJSON(jsonString);
  const preferences = get(themePreferencesAtom);

  themeManager.registerTheme(theme);

  set(themePreferencesAtom, {
    ...preferences,
    customThemes: {
      ...preferences.customThemes,
      [theme.name]: theme,
    },
  });

  return theme;
});

export const initializeThemesAtom = atom(null, (get, set) => {
  const preferences = get(themePreferencesAtom);

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
