import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconDatabase, IconTrophy, IconX } from "@tabler/icons-react";
import { appDataDir, join, resolve } from "@tauri-apps/api/path";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { commands, events } from "@/bindings";
import ProgressButton from "@/common/components/ProgressButton";
import { enginesAtom } from "@/state/atoms";
import { type LocalEngine, type RemoteEngine, requiredEngineSettings, useDefaultEngines } from "@/utils/engines";
import { usePlatform } from "@/utils/files";
import { unwrap } from "@/utils/unwrap";
import EngineForm from "./EngineForm";

function AddEngine({ opened, setOpened }: { opened: boolean; setOpened: (opened: boolean) => void }) {
  const { t } = useTranslation();

  const [allEngines, setEngines] = useAtom(enginesAtom);
  const engines = allEngines.filter((e): e is LocalEngine => e.type === "local");

  const { os } = usePlatform();

  const { defaultEngines, error, isLoading } = useDefaultEngines(os, opened);

  const form = useForm<LocalEngine>({
    initialValues: {
      type: "local",
      version: "",
      name: "",
      path: "",
      image: "",
      elo: undefined,
    },

    validate: {
      name: (value) => {
        if (!value) return t("Common.RequireName");
        if (engines.find((e) => e.name === value)) return t("Common.NameAlreadyUsed");
      },
      path: (value) => {
        if (!value) return t("Common.RequirePath");
      },
    },
  });

  return (
    <Modal opened={opened} onClose={() => setOpened(false)} title={t("Engines.Add.Title")}>
      <Tabs defaultValue="download">
        <Tabs.List>
          <Tabs.Tab value="download">{t("Common.Download")}</Tabs.Tab>
          <Tabs.Tab value="cloud">{t("Engines.Add.Cloud")}</Tabs.Tab>
          <Tabs.Tab value="local">{t("Common.Local")}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="download" pt="xs">
          {isLoading && (
            <Center>
              <Loader />
            </Center>
          )}
          <ScrollArea.Autosize mah={500} offsetScrollbars>
            <Stack>
              {defaultEngines?.map((engine, i) => (
                <EngineCard
                  // @ts-expect-error
                  engine={engine}
                  engineId={i}
                  key={engine.name}
                />
              ))}
              {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} title={t("Common.Error")} color="red">
                  {t("Engines.Add.ErrorFetch")}
                </Alert>
              )}
            </Stack>
          </ScrollArea.Autosize>
        </Tabs.Panel>
        <Tabs.Panel value="cloud" pt="xs">
          <Stack>
            <CloudCard
              engine={{
                name: "ChessDB",
                type: "chessdb",
                url: "https://chessdb.cn",
              }}
            />
            <CloudCard
              engine={{
                name: "Lichess Cloud",
                type: "lichess",
                url: "https://lichess.org",
              }}
            />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="local" pt="xs">
          <EngineForm
            submitLabel={t("Common.Add")}
            form={form}
            onSubmit={(values: LocalEngine) => {
              setEngines(async (prev) => [...(await prev), values]);
              setOpened(false);
            }}
          />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}

function CloudCard({ engine }: { engine: RemoteEngine }) {
  const { t } = useTranslation();

  const [allEngines, setEngines] = useAtom(enginesAtom);
  const isInstalled = allEngines.find((e) => e.type === engine.type) !== undefined;

  return (
    <Paper withBorder radius="md" p={0} key={engine.name}>
      <Group wrap="nowrap" gap={0} grow>
        <Box p="md" flex={1}>
          <Text tt="uppercase" c="dimmed" fw={700} size="xs">
            {t("Common.Engine")}
          </Text>
          <Text fw="bold">{engine.name}</Text>
          <Text size="xs" c="dimmed" mb="xs">
            {engine.url}
          </Text>
          <Button
            disabled={isInstalled}
            fullWidth
            onClick={() => {
              setEngines(async (prev) => [
                ...(await prev),
                {
                  ...engine,
                  type: engine.type,
                  loaded: true,
                  settings: [
                    {
                      name: "MultiPV",
                      value: "1",
                    },
                  ],
                },
              ]);
            }}
          >
            {t("Common.Add")}
          </Button>
        </Box>
      </Group>
    </Paper>
  );
}

function EngineCard({ engine, engineId }: { engine: LocalEngine; engineId: number }) {
  const { t } = useTranslation();

  const [inProgress, setInProgress] = useState<boolean>(false);
  const [allEngines, setEngines] = useAtom(enginesAtom);
  const engines = allEngines.filter((e): e is LocalEngine => e.type === "local");
  const isInstalled = engines.some((e) => e.name === engine.name);

  const installEngine = useCallback(
    async (id: number) => {
      setInProgress(true);

      try {
        let enginePath: string;

        if (engine.installMethod === "download") {
          const url = engine.downloadLink;
          if (!url) throw new Error("Download link not found");

          let path = await resolve(await appDataDir(), "engines", `${url.slice(url.lastIndexOf("/") + 1)}`);
          if (url.endsWith(".zip") || url.endsWith(".tar")) {
            path = await resolve(await appDataDir(), "engines");
          }
          await commands.downloadFile(`engine_${id}`, url, path, null, null, null);
          let appDataDirPath = await appDataDir();
          if (appDataDirPath.endsWith("/") || appDataDirPath.endsWith("\\")) {
            appDataDirPath = appDataDirPath.slice(0, -1);
          }
          enginePath = await join(appDataDirPath, "engines", ...engine.path.split("/"));
          await commands.setFileAsExecutable(enginePath);
        } else if (engine.installMethod === "brew") {
          const brewPackage = engine.brewPackage;
          if (!brewPackage) throw new Error("Brew package name not found");

          const result = unwrap(await commands.installPackage("brew", brewPackage));
          if (!result.success) {
            throw new Error(`Brew installation failed: ${result.stderr}`);
          }
          enginePath = engine.path;
        } else if (engine.installMethod === "package") {
          const packageCommand = engine.packageCommand;
          if (!packageCommand) throw new Error("Package command not found");

          const [manager, ...args] = packageCommand.split(" ");
          const packageName = args[args.length - 1];

          const result = unwrap(await commands.installPackage(manager.replace("sudo", "").trim(), packageName));
          if (!result.success) {
            throw new Error(`Package installation failed: ${result.stderr}`);
          }
          enginePath = engine.path;
        } else {
          throw new Error(`Unsupported installation method: ${engine.installMethod}`);
        }

        const configResult = await commands.getEngineConfig(enginePath);
        const config = configResult.status === "ok" ? configResult.data : { name: engine.name, options: [] };

        setEngines(async (prev) => [
          ...(await prev),
          {
            ...engine,
            type: "local" as const,
            path: enginePath,
            loaded: true,
            settings: config.options
              .filter((o) => requiredEngineSettings.includes(o.value.name))
              .map((o) => {
                let defaultValue: string | number | boolean = "";
                switch (o.type) {
                  case "check":
                    defaultValue = o.value.default ?? false;
                    break;
                  case "spin":
                    defaultValue = Number(o.value.default ?? 0);
                    break;
                  case "combo":
                  case "string":
                    defaultValue = o.value.default ?? "";
                    break;
                  default:
                    defaultValue = "";
                }
                return {
                  name: o.value.name,
                  value: defaultValue,
                };
              }),
          },
        ]);
      } catch (error) {
        console.error("Engine installation failed:", error);
        notifications.show({
          title: t("Common.Error"),
          message: error instanceof Error ? error.message : String(error),
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setInProgress(false);
      }
    },
    [engine, setEngines, t],
  );

  const getInstallText = () => {
    switch (engine.installMethod) {
      case "brew":
        return `brew install ${engine.brewPackage}`;
      case "package":
        return engine.packageCommand || "Install via package manager";
      default:
        return t("Units.Bytes", { bytes: engine.downloadSize ?? 0 });
    }
  };

  const getInstallActionLabel = () => {
    switch (engine.installMethod) {
      case "brew":
        return t("Common.Install") + " (Brew)";
      case "package":
        return t("Common.Install") + " (Package)";
      default:
        return t("Common.Install");
    }
  };

  const getProgressLabel = () => {
    switch (engine.installMethod) {
      case "brew":
      case "package":
        return "Installing...";
      default:
        return t("Common.Downloading");
    }
  };

  return (
    <Paper withBorder radius="md" p={0} key={engine.name}>
      <Group wrap="nowrap" gap={0} grow>
        {engine.image && (
          <Box w="2rem" px="xs">
            <Image src={engine.image} alt={engine.name} fit="contain" />
          </Box>
        )}
        <Box p="md" flex={1}>
          <Text tt="uppercase" c="dimmed" fw={700} size="xs">
            {t("Common.Engine")}
          </Text>
          <Text fw="bold" mb="xs">
            {engine.name} {engine.version}
          </Text>
          <Group wrap="nowrap" gap="xs">
            <IconTrophy size="1rem" />
            <Text size="xs">{`${engine.elo} ELO`}</Text>
          </Group>
          <Group wrap="nowrap" gap="xs" mb="xs">
            <IconDatabase size="1rem" />
            <Text size="xs">{getInstallText()}</Text>
          </Group>
          <ProgressButton
            id={`engine_${engineId}`}
            progressEvent={events.downloadProgress}
            initInstalled={isInstalled}
            labels={{
              completed: t("Common.Installed"),
              action: getInstallActionLabel(),
              inProgress: getProgressLabel(),
              finalizing: t("Common.Extracting"),
            }}
            onClick={() => installEngine(engineId)}
            inProgress={inProgress}
            setInProgress={setInProgress}
          />
        </Box>
      </Group>
    </Paper>
  );
}

export default AddEngine;
