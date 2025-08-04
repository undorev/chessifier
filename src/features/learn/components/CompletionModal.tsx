import { Button, Center, Group, Modal, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconCheck, IconConfetti, IconStar, IconTrophy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface CompletionModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  onContinue: () => void;
  onBackToList: () => void;
}

export function CompletionModal({ opened, onClose, title, onContinue, onBackToList }: CompletionModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>{t("Lessons.Completed")}</Title>}
      centered
      size="md"
    >
      <Stack align="center" gap="md" py="md">
        <Center>
          <IconConfetti size={60} color="gold" stroke={1.5} />
          <IconStar size={60} color="gold" stroke={1.5} />
          <IconTrophy size={60} color="gold" stroke={1.5} />
        </Center>

        <Text size="xl" fw={700} ta="center">
          {t("Lessons.LessonCompleted", { lesson: title })}
        </Text>

        <Text ta="center">{t("Lessons.CompletionMessage")}</Text>

        <Group mt="md">
          <Button onClick={onContinue} leftSection={<IconCheck size={16} />} color="green">
            {t("Common.Continue")}
          </Button>

          <Button variant="light" onClick={onBackToList} leftSection={<IconArrowLeft size={16} />}>
            {t("Lessons.BackToLessons")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
