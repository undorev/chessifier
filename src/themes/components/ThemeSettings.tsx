import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Menu,
  Modal,
  Popover,
  rem,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useId } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconCopy,
  IconDots,
  IconDownload,
  IconEdit,
  IconFileExport,
  IconFileImport,
  IconMoon,
  IconPalette,
  IconSun,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as classes from "@/features/settings/SettingsPage.css";
import { useTheme, useThemeCustomization, useThemeDetection } from "../hooks";
import type { ThemeDefinition } from "../types";
import ThemeEditor from "./ThemeEditor";

interface ThemeCardProps {
  theme: {
    name: string;
    displayName: string;
    type: "light" | "dark";
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

function ThemeCard({ theme, isActive, onSelect, onEdit, onDelete, onDuplicate, onExport }: ThemeCardProps) {
  return (
    <Card
      p="md"
      withBorder
      style={{
        cursor: "pointer",
        borderColor: isActive ? "var(--mantine-primary-color-filled)" : undefined,
        backgroundColor: isActive ? "var(--mantine-color-blue-light)" : undefined,
      }}
      onClick={onSelect}
    >
      <Group justify="space-between" align="flex-start">
        <Group gap="sm" style={{ flex: 1 }}>
          {theme.type === "light" ? (
            <IconSun size={rem(20)} color="var(--mantine-color-yellow-6)" />
          ) : (
            <IconMoon size={rem(20)} color="var(--mantine-color-indigo-6)" />
          )}

          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs">
              <Text fw={500} size="sm">
                {theme.displayName}
              </Text>
              {theme.isCustom && (
                <Badge size="xs" variant="light">
                  Custom
                </Badge>
              )}
            </Group>

            {theme.description && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {theme.description}
              </Text>
            )}
          </Stack>
        </Group>

        {theme.isCustom && (
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm" onClick={(e) => e.stopPropagation()}>
                <IconDots size={rem(14)} />
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
                <>
                  <Menu.Divider />
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
                </>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Card>
  );
}

export function ThemeSettings() {
  const { t } = useTranslation();
  const { currentTheme, availableThemes, setTheme, autoDetectEnabled, getTheme } = useTheme();
  const { createCustomTheme, duplicateTheme, deleteCustomTheme, exportTheme, saveCustomTheme } =
    useThemeCustomization();
  const { toggleAutoDetection } = useThemeDetection();
  const [editorOpened, setEditorOpened] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeDefinition | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [exportJson, setExportJson] = useState("");
  const fileInputId = useId();

  const handleManualThemeChange = (themeName: string) => {
    if (autoDetectEnabled) {
      toggleAutoDetection();
    }
    setTheme(themeName);
  };

  const handleCreateCustomTheme = () => {
    if (currentTheme) {
      const customTheme = createCustomTheme(currentTheme, {
        name: `custom-${Date.now()}`,
        displayName: `Custom ${currentTheme.displayName}`,
        description: `Custom theme based on ${currentTheme.displayName}`,
      });

      saveCustomTheme(customTheme);

      notifications.show({
        title: "Custom Theme Created",
        message: `Created custom theme "${customTheme.displayName}"`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    }
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
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedTheme = JSON.parse(content);

          if (!importedTheme.name || !importedTheme.displayName || !importedTheme.colors) {
            throw new Error("Invalid theme format");
          }

          const customTheme = createCustomTheme(importedTheme, {
            name: `imported-${Date.now()}`,
            displayName: importedTheme.displayName,
            description: importedTheme.description || "Imported theme",
          });

          saveCustomTheme(customTheme);

          notifications.show({
            title: "Theme Imported",
            message: `Successfully imported "${customTheme.displayName}"`,
            color: "green",
            icon: <IconCheck size={18} />,
          });
        } catch {
          notifications.show({
            title: "Import Failed",
            message: "Invalid theme file format",
            color: "red",
          });
        }

        event.target.value = "";
      };
      reader.readAsText(file);
    }
  };

  const handleImportTheme = () => {
    try {
      const importedTheme = JSON.parse(importJson);

      if (!importedTheme.name || !importedTheme.displayName || !importedTheme.colors) {
        throw new Error("Invalid theme format");
      }

      const customTheme = createCustomTheme(importedTheme, {
        name: `imported-${Date.now()}`,
        displayName: importedTheme.displayName,
        description: importedTheme.description || "Imported theme",
      });

      saveCustomTheme(customTheme);
      setImportModalOpen(false);
      setImportJson("");

      notifications.show({
        title: "Theme Imported",
        message: `Successfully imported "${customTheme.displayName}"`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch {
      notifications.show({
        title: "Import Failed",
        message: "Invalid theme JSON format",
        color: "red",
        icon: <IconX size={18} />,
      });
    }
  };

  const handleExportCurrentTheme = () => {
    if (currentTheme) {
      setExportJson(JSON.stringify(currentTheme, null, 2));
      setExportModalOpen(true);
    }
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

  return (
    <Stack gap="xl">
      <Group justify="space-between" wrap="nowrap" gap="xl" className={classes.item}>
        <div>
          <Text>{t("Settings.Appearance.Theme", "Theme")}</Text>
          <Text size="xs" c="dimmed">
            {t("Settings.Appearance.Theme.Desc", "Overall color scheme")}
          </Text>
        </div>

        <Group gap="xs">
          <Tooltip label="Import from file">
            <ActionIcon variant="subtle" component="label" htmlFor={fileInputId}>
              <IconUpload size={rem(16)} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Import from JSON">
            <ActionIcon variant="subtle" onClick={() => setImportModalOpen(true)}>
              <IconFileImport size={rem(16)} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Export current theme">
            <ActionIcon variant="subtle" onClick={handleExportCurrentTheme} disabled={!currentTheme}>
              <IconFileExport size={rem(16)} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Create custom theme">
            <ActionIcon variant="subtle" onClick={handleCreateCustomTheme} disabled={!currentTheme}>
              <IconPalette size={rem(16)} />
            </ActionIcon>
          </Tooltip>

          <Popover trapFocus position="top-end" shadow="md">
            <Popover.Target>
              <Button variant="default">{currentTheme?.displayName}</Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="xs">
                {availableThemes.map((theme) => (
                  <ThemeCard
                    key={theme.name}
                    theme={theme}
                    isActive={currentTheme?.name === theme.name}
                    onSelect={() => handleManualThemeChange(theme.name)}
                    onEdit={theme.isCustom ? () => handleEditTheme(theme.name) : undefined}
                    onDelete={theme.isCustom ? () => deleteCustomTheme(theme.name) : undefined}
                    onDuplicate={() => duplicateTheme(theme.name)}
                    onExport={() => handleExportTheme(theme.name)}
                  />
                ))}
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Group>

      <ThemeEditor
        theme={editingTheme}
        opened={editorOpened}
        onClose={() => {
          setEditorOpened(false);
          setEditingTheme(null);
        }}
      />

      <Modal opened={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import Theme" size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Paste the JSON content of a theme file below:
          </Text>

          <Textarea
            placeholder="Paste theme JSON here..."
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            minRows={10}
            maxRows={15}
            autosize
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportTheme} disabled={!importJson.trim()}>
              Import Theme
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Theme" size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Copy the JSON content below to share or backup this theme:
          </Text>

          <Code block>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{exportJson}</pre>
          </Code>

          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                navigator.clipboard.writeText(exportJson);
                notifications.show({
                  title: "Copied!",
                  message: "Theme JSON copied to clipboard",
                  color: "green",
                  icon: <IconCheck size={18} />,
                });
              }}
            >
              Copy to Clipboard
            </Button>
            <Button onClick={() => setExportModalOpen(false)}>Close</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export default ThemeSettings;
