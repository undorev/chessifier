import { generateColors } from "@mantine/colors-generator";
import {
  ActionIcon,
  Autocomplete,
  createTheme,
  Input,
  type MantineColorsTuple,
  Textarea,
  TextInput,
} from "@mantine/core";
import type { ThemeDefinition } from "./types";

function generateMantineColors(theme: ThemeDefinition, primaryColor: string): Record<string, MantineColorsTuple> {
  if (theme.name === "classic-dark") {
    return {
      dark: [
        "#C1C2C5",
        "#A6A7AB",
        "#909296",
        "#5c5f66",
        "#373A40",
        "#2C2E33",
        "#25262b",
        "#1A1B1E",
        "#141517",
        "#101113",
      ] as MantineColorsTuple,
    };
  }

  const primaryBase = theme.colors["button.background"] || primaryColor;

  return {
    blue: generateColors(primaryBase),
  };
}

export function convertToMantineTheme(theme: ThemeDefinition, primaryColor: string, spellCheck: boolean = true) {
  const themeConfig: Record<string, unknown> = {
    primaryColor,
    colors: generateMantineColors(theme, primaryColor),
  };

  if (theme.typography?.fontFamily) {
    themeConfig.fontFamily = theme.typography.fontFamily;
  }

  if (theme.spacing) {
    themeConfig.spacing = {
      xs: theme.spacing.xs,
      sm: theme.spacing.sm,
      md: theme.spacing.md,
      lg: theme.spacing.lg,
      xl: theme.spacing.xl,
    };
  }

  if (theme.borderRadius) {
    themeConfig.radius = {
      xs: theme.borderRadius.xs,
      sm: theme.borderRadius.sm,
      md: theme.borderRadius.md,
      lg: theme.borderRadius.lg,
      xl: theme.borderRadius.xl,
    };
  }

  themeConfig.components = {
    ActionIcon: ActionIcon.extend({
      defaultProps: {
        variant: "transparent",
        color: "gray",
      },
    }),
    Autocomplete: Autocomplete.extend({
      defaultProps: {
        spellCheck: spellCheck,
      },
    }),
    Textarea: Textarea.extend({
      defaultProps: {
        spellCheck: spellCheck,
      },
    }),
    Input: Input.extend({
      defaultProps: {
        // @ts-expect-error
        spellCheck: spellCheck,
      },
    }),
    TextInput: TextInput.extend({
      defaultProps: {
        spellCheck: spellCheck,
      },
    }),
  };

  return createTheme(themeConfig);
}
