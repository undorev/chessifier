import { Box, Center, Group, type MantineColorScheme, SegmentedControl, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun, IconSunMoon } from "@tabler/icons-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme, useThemeDetection } from "@/themes";

export default function EnhancedThemeButton() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { currentTheme, setTheme } = useTheme();
  const { autoDetectEnabled, toggleAutoDetection } = useThemeDetection();

  useEffect(() => {
    if (currentTheme) {
      const mantineScheme: MantineColorScheme = autoDetectEnabled
        ? "auto"
        : currentTheme.type === "dark"
          ? "dark"
          : "light";

      if (colorScheme !== mantineScheme) {
        setColorScheme(mantineScheme);
      }
    }
  }, [currentTheme, autoDetectEnabled, colorScheme, setColorScheme]);

  const handleColorSchemeChange = (value: string) => {
    const newScheme = value as MantineColorScheme;
    setColorScheme(newScheme);

    if (newScheme === "auto") {
      if (!autoDetectEnabled) {
        toggleAutoDetection();
      }
    } else {
      if (autoDetectEnabled) {
        toggleAutoDetection();
      }
      
      if (newScheme === "dark") {
        if (currentTheme?.type !== "dark") {
          setTheme("classic-dark");
        }
      } else if (newScheme === "light") {
        if (currentTheme?.type !== "light") {
          setTheme("classic-light");
        }
      }
    }
  };

  return (
    <Group justify="center">
      <SegmentedControl
        value={colorScheme}
        onChange={handleColorSchemeChange}
        data={[
          {
            value: "light",
            label: (
              <Center>
                <IconSun size="1rem" stroke={1.5} />
                <Box ml={10}>{t("Settings.Appearance.Theme.Light")}</Box>
              </Center>
            ),
          },
          {
            value: "dark",
            label: (
              <Center>
                <IconMoon size="1rem" stroke={1.5} />
                <Box ml={10}>{t("Settings.Appearance.Theme.Dark")}</Box>
              </Center>
            ),
          },
          {
            value: "auto",
            label: (
              <Center>
                <IconSunMoon size="1rem" stroke={1.5} />
                <Box ml={10}>{t("Settings.Appearance.Theme.Auto")}</Box>
              </Center>
            ),
          },
        ]}
      />
    </Group>
  );
}
