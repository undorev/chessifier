import { Text } from "@mantine/core";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { arch, version as OSVersion, type } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";

function AboutModal() {
  const [info, setInfo] = useState<{
    version: string;
    tauri: string;
    os: string;
    architecture: string;
    osVersion: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const os = await type();
      const version = await getVersion();
      const tauri = await getTauriVersion();
      const architecture = await arch();
      const osVersion = await OSVersion();
      setInfo({ version, tauri, os, architecture, osVersion });
    }
    load();
  }, []);
  return (
    <>
      <Text>Version: {info?.version}</Text>
      <Text>Tauri version: {info?.tauri}</Text>
      <Text>
        OS: {info?.os} {info?.architecture} {info?.osVersion}
      </Text>
    </>
  );
}

export default AboutModal;
