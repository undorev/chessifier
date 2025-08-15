import {
  Button,
  ColorInput,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconLayout, IconPalette, IconTypography } from "@tabler/icons-react";
import { useState } from "react";
import { useThemeCustomization } from "../hooks";
import type { ThemeDefinition } from "../types";

interface ThemeEditorProps {
  theme: ThemeDefinition | null;
  opened: boolean;
  onClose: () => void;
  onSave?: (theme: ThemeDefinition) => void;
}

export function ThemeEditor({ theme, opened, onClose, onSave }: ThemeEditorProps) {
  const { saveCustomTheme } = useThemeCustomization();
  const [activeTab, setActiveTab] = useState<string>("general");

  const getDefaultTheme = (): ThemeDefinition => ({
    name: "",
    displayName: "",
    type: "light",
    description: "",
    author: "",
    version: "1.0.0",
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#000000",
      "editor.selectionBackground": "#007acc20",
      "editor.lineHighlightBackground": "#f5f5f5",
      "editor.cursorForeground": "#000000",
      "button.background": "#007acc",
      "button.foreground": "#ffffff",
      "button.hoverBackground": "#005a9e",
      "button.border": "#007acc",
      "input.background": "#ffffff",
      "input.foreground": "#000000",
      "input.border": "#cccccc",
      "input.focusBorder": "#007acc",
      "dropdown.background": "#ffffff",
      "dropdown.foreground": "#000000",
      "dropdown.border": "#cccccc",
      "panel.background": "#f8f8f8",
      "panel.border": "#cccccc",
      "sidebar.background": "#f8f8f8",
      "sidebar.foreground": "#000000",
      "sidebar.border": "#cccccc",
      "tab.activeBackground": "#ffffff",
      "tab.activeForeground": "#000000",
      "tab.inactiveBackground": "#f8f8f8",
      "tab.inactiveForeground": "#666666",
      "tab.border": "#cccccc",
      "tab.hoverBackground": "#ffffff",
      "list.activeSelectionBackground": "#007acc",
      "list.activeSelectionForeground": "#ffffff",
      "list.inactiveSelectionBackground": "#007acc20",
      "list.hoverBackground": "#f5f5f5",
      "notification.background": "#ffffff",
      "notification.foreground": "#000000",
      "notification.border": "#cccccc",
      "badge.background": "#007acc",
      "badge.foreground": "#ffffff",
      "progress.background": "#cccccc",
      "progress.foreground": "#007acc",
      "scrollbar.shadow": "rgba(0, 0, 0, 0.1)",
      "scrollbar.thumb": "#cccccc",
      "scrollbar.thumbHover": "#999999",
      "board.lightSquare": "#f0d9b5",
      "board.darkSquare": "#b58863",
      "board.selectedSquare": "#007acc",
      "board.lastMoveSquare": "#ffeb3b",
      "board.checkSquare": "#f44336",
      "board.coordinate": "#8b7355",
      "piece.shadow": "rgba(0, 0, 0, 0.3)",
      "analysis.bestMove": "#4caf50",
      "analysis.goodMove": "#2196f3",
      "analysis.inaccuracy": "#ff9800",
      "analysis.mistake": "#ff5722",
      "analysis.blunder": "#f44336",
      "status.info": "#2196f3",
      "status.warning": "#ff9800",
      "status.error": "#f44336",
      "status.success": "#4caf50",
      "text.primary": "#000000",
      "text.secondary": "#666666",
      "text.disabled": "#999999",
      "text.link": "#007acc",
      "border.primary": "#cccccc",
      "border.secondary": "#e0e0e0",
      "border.focus": "#007acc",
      "shadow.primary": "rgba(0, 0, 0, 0.1)",
      "shadow.secondary": "rgba(0, 0, 0, 0.05)",
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: "14px",
      fontWeight: "400",
      lineHeight: "1.5",
      letterSpacing: "0",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
    },
    borderRadius: {
      xs: "2px",
      sm: "4px",
      md: "6px",
      lg: "8px",
      xl: "12px",
    },
  });

  const form = useForm<ThemeDefinition>({
    initialValues: theme || getDefaultTheme(),
  });

  const handleSave = (values: ThemeDefinition) => {
    try {
      if (onSave) {
        onSave(values);
      } else {
        saveCustomTheme(values);
      }

      notifications.show({
        title: "Theme saved",
        message: `Successfully saved "${values.displayName}"`,
        color: "green",
        icon: <IconCheck size={18} />,
      });

      onClose();
    } catch (error) {
      notifications.show({
        title: "Save failed",
        message: error instanceof Error ? error.message : "Unknown error",
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPalette size={20} />
          <Text fw={500}>{theme ? `Edit "${theme.displayName}"` : "Create New Theme"}</Text>
        </Group>
      }
      size="lg"
    >
      <form key={theme?.name || "new"} onSubmit={form.onSubmit(handleSave)}>
        <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)}>
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="colors" leftSection={<IconPalette size={16} />}>
              Colors
            </Tabs.Tab>
            <Tabs.Tab value="typography" leftSection={<IconTypography size={16} />}>
              Typography
            </Tabs.Tab>
            <Tabs.Tab value="layout" leftSection={<IconLayout size={16} />}>
              Layout
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general" pt="md">
            <Stack gap="md">
              <TextInput label="Theme Name" placeholder="my-custom-theme" required {...form.getInputProps("name")} />

              <TextInput
                label="Display Name"
                placeholder="My Custom Theme"
                required
                {...form.getInputProps("displayName")}
              />

              <Select
                label="Theme Type"
                required
                data={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                {...form.getInputProps("type")}
              />

              <Textarea
                label="Description"
                placeholder="A beautiful custom theme..."
                autosize
                minRows={2}
                {...form.getInputProps("description")}
              />

              <Group grow>
                <TextInput label="Author" placeholder="Your name" {...form.getInputProps("author")} />
                <TextInput label="Version" placeholder="1.0.0" {...form.getInputProps("version")} />
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="colors" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Customize the color scheme for your theme. Hover over labels for descriptions.
              </Text>

              <SimpleGrid cols={2} spacing="md">
                {/* Editor Colors */}
                <div>
                  <Text fw={500} mb="sm">
                    Editor
                  </Text>
                  <Stack gap="xs">
                    <ColorInput
                      label="Background"
                      value={form.values.colors?.["editor.background"] || "#ffffff"}
                      onChange={(value) => form.setFieldValue("colors.editor.background", value)}
                    />
                    <ColorInput
                      label="Foreground"
                      value={form.values.colors?.["editor.foreground"] || "#000000"}
                      onChange={(value) => form.setFieldValue("colors.editor.foreground", value)}
                    />
                    <ColorInput
                      label="Selection"
                      value={form.values.colors?.["editor.selectionBackground"] || "#007acc20"}
                      onChange={(value) => form.setFieldValue("colors.editor.selectionBackground", value)}
                    />
                    <ColorInput
                      label="Line Highlight"
                      value={form.values.colors?.["editor.lineHighlightBackground"] || "#f5f5f5"}
                      onChange={(value) => form.setFieldValue("colors.editor.lineHighlightBackground", value)}
                    />
                  </Stack>
                </div>

                {/* Button Colors */}
                <div>
                  <Text fw={500} mb="sm">
                    Buttons
                  </Text>
                  <Stack gap="xs">
                    <ColorInput
                      label="Background"
                      value={form.values.colors?.["button.background"] || "#007acc"}
                      onChange={(value) => form.setFieldValue("colors.button.background", value)}
                    />
                    <ColorInput
                      label="Foreground"
                      value={form.values.colors?.["button.foreground"] || "#ffffff"}
                      onChange={(value) => form.setFieldValue("colors.button.foreground", value)}
                    />
                    <ColorInput
                      label="Hover Background"
                      value={form.values.colors?.["button.hoverBackground"] || "#005a9e"}
                      onChange={(value) => form.setFieldValue("colors.button.hoverBackground", value)}
                    />
                    <ColorInput
                      label="Border"
                      value={form.values.colors?.["button.border"] || "#007acc"}
                      onChange={(value) => form.setFieldValue("colors.button.border", value)}
                    />
                  </Stack>
                </div>

                {/* Input Colors */}
                <div>
                  <Text fw={500} mb="sm">
                    Inputs
                  </Text>
                  <Stack gap="xs">
                    <ColorInput
                      label="Background"
                      value={form.values.colors?.["input.background"] || "#ffffff"}
                      onChange={(value) => form.setFieldValue("colors.input.background", value)}
                    />
                    <ColorInput
                      label="Foreground"
                      value={form.values.colors?.["input.foreground"] || "#000000"}
                      onChange={(value) => form.setFieldValue("colors.input.foreground", value)}
                    />
                    <ColorInput
                      label="Border"
                      value={form.values.colors?.["input.border"] || "#cccccc"}
                      onChange={(value) => form.setFieldValue("colors.input.border", value)}
                    />
                    <ColorInput
                      label="Focus Border"
                      value={form.values.colors?.["input.focusBorder"] || "#007acc"}
                      onChange={(value) => form.setFieldValue("colors.input.focusBorder", value)}
                    />
                  </Stack>
                </div>

                {/* Panel Colors */}
                <div>
                  <Text fw={500} mb="sm">
                    Panels
                  </Text>
                  <Stack gap="xs">
                    <ColorInput
                      label="Background"
                      value={form.values.colors?.["panel.background"] || "#f8f8f8"}
                      onChange={(value) => form.setFieldValue("colors.panel.background", value)}
                    />
                    <ColorInput
                      label="Border"
                      value={form.values.colors?.["panel.border"] || "#cccccc"}
                      onChange={(value) => form.setFieldValue("colors.panel.border", value)}
                    />
                    <ColorInput
                      label="Sidebar Background"
                      value={form.values.colors?.["sidebar.background"] || "#f8f8f8"}
                      onChange={(value) => form.setFieldValue("colors.sidebar.background", value)}
                    />
                    <ColorInput
                      label="Sidebar Foreground"
                      value={form.values.colors?.["sidebar.foreground"] || "#000000"}
                      onChange={(value) => form.setFieldValue("colors.sidebar.foreground", value)}
                    />
                  </Stack>
                </div>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="typography" pt="md">
            <Stack gap="md">
              <TextInput
                label="Font Family"
                placeholder="-apple-system, BlinkMacSystemFont, sans-serif"
                value={form.values.typography?.fontFamily || ""}
                onChange={(event) => form.setFieldValue("typography.fontFamily", event.currentTarget.value)}
              />

              <Group grow>
                <TextInput
                  label="Font Size"
                  placeholder="14px"
                  value={form.values.typography?.fontSize || ""}
                  onChange={(event) => form.setFieldValue("typography.fontSize", event.currentTarget.value)}
                />
                <TextInput
                  label="Font Weight"
                  placeholder="400"
                  value={form.values.typography?.fontWeight || ""}
                  onChange={(event) => form.setFieldValue("typography.fontWeight", event.currentTarget.value)}
                />
              </Group>

              <Group grow>
                <TextInput
                  label="Line Height"
                  placeholder="1.5"
                  value={form.values.typography?.lineHeight || ""}
                  onChange={(event) => form.setFieldValue("typography.lineHeight", event.currentTarget.value)}
                />
                <TextInput
                  label="Letter Spacing"
                  placeholder="0"
                  value={form.values.typography?.letterSpacing || ""}
                  onChange={(event) => form.setFieldValue("typography.letterSpacing", event.currentTarget.value)}
                />
              </Group>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="layout" pt="md">
            <Stack gap="md">
              <div>
                <Text fw={500} mb="sm">
                  Spacing
                </Text>
                <SimpleGrid cols={3} spacing="md">
                  <TextInput
                    label="XS"
                    placeholder="4px"
                    value={form.values.spacing?.xs || ""}
                    onChange={(event) => form.setFieldValue("spacing.xs", event.currentTarget.value)}
                  />
                  <TextInput
                    label="SM"
                    placeholder="8px"
                    value={form.values.spacing?.sm || ""}
                    onChange={(event) => form.setFieldValue("spacing.sm", event.currentTarget.value)}
                  />
                  <TextInput
                    label="MD"
                    placeholder="16px"
                    value={form.values.spacing?.md || ""}
                    onChange={(event) => form.setFieldValue("spacing.md", event.currentTarget.value)}
                  />
                  <TextInput
                    label="LG"
                    placeholder="24px"
                    value={form.values.spacing?.lg || ""}
                    onChange={(event) => form.setFieldValue("spacing.lg", event.currentTarget.value)}
                  />
                  <TextInput
                    label="XL"
                    placeholder="32px"
                    value={form.values.spacing?.xl || ""}
                    onChange={(event) => form.setFieldValue("spacing.xl", event.currentTarget.value)}
                  />
                </SimpleGrid>
              </div>

              <div>
                <Text fw={500} mb="sm">
                  Border Radius
                </Text>
                <SimpleGrid cols={3} spacing="md">
                  <TextInput
                    label="XS"
                    placeholder="2px"
                    value={form.values.borderRadius?.xs || ""}
                    onChange={(event) => form.setFieldValue("borderRadius.xs", event.currentTarget.value)}
                  />
                  <TextInput
                    label="SM"
                    placeholder="4px"
                    value={form.values.borderRadius?.sm || ""}
                    onChange={(event) => form.setFieldValue("borderRadius.sm", event.currentTarget.value)}
                  />
                  <TextInput
                    label="MD"
                    placeholder="6px"
                    value={form.values.borderRadius?.md || ""}
                    onChange={(event) => form.setFieldValue("borderRadius.md", event.currentTarget.value)}
                  />
                  <TextInput
                    label="LG"
                    placeholder="8px"
                    value={form.values.borderRadius?.lg || ""}
                    onChange={(event) => form.setFieldValue("borderRadius.lg", event.currentTarget.value)}
                  />
                  <TextInput
                    label="XL"
                    placeholder="12px"
                    value={form.values.borderRadius?.xl || ""}
                    onChange={(event) => form.setFieldValue("borderRadius.xl", event.currentTarget.value)}
                  />
                </SimpleGrid>
              </div>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="xl">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" leftSection={<IconCheck size={16} />}>
            Save Theme
          </Button>
        </Group>
      </form>
    </Modal>
  );
}

export default ThemeEditor;
