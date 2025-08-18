import { ActionIcon, Badge, Group, Menu, Paper, rem, Select, Stack, Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCopy,
  IconDots,
  IconDownload,
  IconEdit,
  IconMoon,
  IconPalette,
  IconSun,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useTheme, useThemeCustomization, useThemeDetection, useThemePersistence } from "../hooks";
import type { ThemeDefinition, ThemeType } from "../types";
import ThemeEditor from "./ThemeEditor";

interface ThemeDisplayProps {
  theme: {
    name: string;
    displayName: string;
    type: ThemeType;
    description?: string;
    author?: string;
    isCustom: boolean;
  };
  isActive: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
}

function ThemeDisplay({ theme, isActive, onSelect, onEdit, onDelete, onDuplicate, onExport }: ThemeDisplayProps) {
  const getTypeIcon = (type: ThemeType) => {
    switch (type) {
      case "light":
        return <IconSun size={rem(16)} />;
      case "dark":
        return <IconMoon size={rem(16)} />;
    }
  };

  return (
    <Paper
      p="md"
      withBorder
      style={{
        cursor: "pointer",
        borderColor: isActive ? "var(--mantine-primary-color-filled)" : undefined,
      }}
      onClick={onSelect}
    >
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group gap="xs">
            {getTypeIcon(theme.type)}
            <Text fw={500}>{theme.displayName}</Text>
            {theme.isCustom && <Badge size="xs">Custom</Badge>}
          </Group>

          {theme.description && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {theme.description}
            </Text>
          )}

          {theme.author && (
            <Text size="xs" c="dimmed">
              by {theme.author}
            </Text>
          )}
        </Stack>

        {theme.isCustom && (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDots size={rem(16)} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {onEdit && (
                <Menu.Item
                  leftSection={<IconEdit size={rem(14)} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  Edit
                </Menu.Item>
              )}

              {onDuplicate && (
                <Menu.Item
                  leftSection={<IconCopy size={rem(14)} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                >
                  Duplicate
                </Menu.Item>
              )}

              {onExport && (
                <Menu.Item
                  leftSection={<IconDownload size={rem(14)} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport();
                  }}
                >
                  Export
                </Menu.Item>
              )}

              {onDelete && (
                <Menu.Item
                  leftSection={<IconTrash size={rem(14)} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  Delete
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Paper>
  );
}

interface ThemeSelectorProps {
  showDescription?: boolean;
  showCustomization?: boolean;
  compact?: boolean;
}

export function ThemeSelector({
  showDescription = true,
  showCustomization = true,
  compact = false,
}: ThemeSelectorProps) {
  const { currentTheme, availableThemes, setTheme, autoDetectEnabled, getTheme } = useTheme();
  const { duplicateTheme, deleteCustomTheme, exportTheme } = useThemeCustomization();
  const { toggleAutoDetection } = useThemeDetection();
  const { importTheme, exportAllThemes } = useThemePersistence();

  const [editorOpened, setEditorOpened] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeDefinition | null>(null);

  const handleManualThemeChange = (themeName: string) => {
    if (autoDetectEnabled) {
      toggleAutoDetection();
    }
    setTheme(themeName);
  };

  const handleEditTheme = (themeName: string) => {
    const theme = getTheme(themeName);
    if (theme) {
      setEditingTheme(theme);
      setEditorOpened(true);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const importedTheme = await importTheme(content);
          console.log("Successfully imported theme:", importedTheme.name);

          event.target.value = "";

          notifications.show({
            title: "Theme imported",
            message: `Successfully imported "${importedTheme.displayName}"`,
            color: "green",
          });
        } catch (error) {
          console.error("Failed to import theme:", error);

          event.target.value = "";

          notifications.show({
            title: "Import failed",
            message: error instanceof Error ? error.message : "Unknown error",
            color: "red",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportAll = () => {
    const data = exportAllThemes();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pawn-appetit-themes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTheme = (themeName: string) => {
    const data = exportTheme(themeName);
    if (data) {
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${themeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (compact) {
    return (
      <Group>
        <Select
          data={availableThemes.map((theme) => ({
            value: theme.name,
            label: theme.displayName,
          }))}
          value={currentTheme?.name || ""}
          onChange={(value) => value && handleManualThemeChange(value)}
          leftSection={<IconPalette size={rem(16)} />}
          placeholder="Select theme"
          style={{ minWidth: 200 }}
        />

        <Tooltip label={autoDetectEnabled ? "Disable auto-detection" : "Enable auto-detection"}>
          <ActionIcon variant={autoDetectEnabled ? "filled" : "subtle"} onClick={toggleAutoDetection}>
            {autoDetectEnabled ? <IconSun size={rem(16)} /> : <IconMoon size={rem(16)} />}
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Text size="lg" fw={600} mb="xs">
          Theme Settings
        </Text>
        <Text size="sm" c="dimmed">
          Choose from built-in themes or create your own custom themes. Auto-detection will automatically switch between
          light and dark themes based on your system preferences.
        </Text>
      </div>

      <Switch
        label="Auto-detect system theme"
        description="Automatically switch themes based on system preferences"
        checked={autoDetectEnabled}
        onChange={toggleAutoDetection}
      />

      <div>
        <Group justify="space-between" mb="md">
          <Text fw={500}>Available Themes</Text>

          {showCustomization && (
            <Group gap="xs">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                style={{ display: "none" }}
                id="theme-import"
              />
              <Tooltip label="Import theme">
                <ActionIcon variant="subtle" component="label" htmlFor="theme-import">
                  <IconUpload size={rem(16)} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label="Export all themes">
                <ActionIcon variant="subtle" onClick={handleExportAll}>
                  <IconDownload size={rem(16)} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>

        <Stack gap="sm">
          {availableThemes.map((theme) => (
            <ThemeDisplay
              key={theme.name}
              theme={theme}
              isActive={currentTheme?.name === theme.name}
              onSelect={() => handleManualThemeChange(theme.name)}
              onEdit={theme.isCustom && showCustomization ? () => handleEditTheme(theme.name) : undefined}
              onDelete={theme.isCustom ? () => deleteCustomTheme(theme.name) : undefined}
              onDuplicate={showCustomization ? () => duplicateTheme(theme.name) : undefined}
              onExport={showCustomization ? () => handleExportTheme(theme.name) : undefined}
            />
          ))}
        </Stack>

        {/* Theme Editor Modal */}
        <ThemeEditor
          theme={editingTheme}
          opened={editorOpened}
          onClose={() => {
            setEditorOpened(false);
            setEditingTheme(null);
          }}
        />
      </div>
    </Stack>
  );
}

export default ThemeSelector;
