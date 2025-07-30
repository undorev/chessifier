import { Box, Button, Card, Group, Image, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconChess, IconFileImport, IconPuzzle } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { activeTabAtom, tabsAtom } from "@/state/atoms";
import { genID, type Tab } from "@/utils/tabs";
import Chessboard from "../icons/Chessboard";
import BoardsPageTabs from "./BoardsPageTabs";

export default function BoardsPage() {
  const { t } = useTranslation();

  const [tabs, setTabs] = useAtom(tabsAtom);
  const [_, setActiveTab] = useAtom(activeTabAtom);

  const PLAY_CHESS = {
    icon: <IconChess size={60} />,
    title: t("Home.Card.PlayChess.Title"),
    description: t("Home.Card.PlayChess.Desc"),
    label: t("Home.Card.PlayChess.Button"),
    onClick: () => {
      const uuid = genID();
      setTabs((prev: Tab[]) => {
        return [
          ...prev,
          {
            value: uuid,
            name: "New Game",
            type: "play",
          },
        ];
      });
      setActiveTab(uuid);
    },
  };

  const cards = [
    {
      icon: <Chessboard size={60} />,
      title: t("Home.Card.AnalysisBoard.Title"),
      description: t("Home.Card.AnalysisBoard.Desc"),
      label: t("Home.Card.AnalysisBoard.Button"),
      onClick: () => {
        const uuid = genID();
        setTabs((prev: Tab[]) => {
          return [
            ...prev,
            {
              value: uuid,
              name: t("Home.Card.AnalysisBoard.Title"),
              type: "analysis",
            },
          ];
        });
        setActiveTab(uuid);
      },
    },
    {
      icon: <IconFileImport size={60} />,
      title: t("Home.Card.ImportGame.Title"),
      description: t("Home.Card.ImportGame.Desc"),
      label: t("Home.Card.ImportGame.Button"),
      onClick: () => {
        modals.openContextModal({
          modal: "importModal",
          innerProps: {},
        });
      },
    },
    {
      icon: <IconPuzzle size={60} />,
      title: t("Home.Card.Puzzle.Title"),
      description: t("Home.Card.Puzzle.Desc"),
      label: t("Home.Card.Puzzle.Button"),
      onClick: () => {
        const uuid = genID();
        setTabs((prev) => {
          return [
            ...prev,
            {
              value: uuid,
              name: "Puzzle Training",
              type: "puzzles",
            },
          ];
        });
        setActiveTab(uuid);
      },
    },
  ];

  if (tabs?.length) {
    return <BoardsPageTabs />;
  }

  return (
    <Stack p="lg">
      <Card shadow="sm" p="lg" radius="md" withBorder key={PLAY_CHESS.title}>
        <Group>
          <Box flex={1} pl="xl">
            <Title order={1} fz="50px" fw={700}>
              {PLAY_CHESS.title}
            </Title>
            <Text size="md" c="dimmed">
              {PLAY_CHESS.description}
            </Text>

            <Button mt="md" radius="md" onClick={PLAY_CHESS.onClick}>
              {PLAY_CHESS.label}
            </Button>
          </Box>
          <Box flex={1}>
            <Image src="/chess-play.jpg" alt="Chess play" radius="lg" />
          </Box>
        </Group>
      </Card>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {cards.map((card) => (
          <Card shadow="sm" p="lg" radius="md" withBorder key={card.title}>
            <Stack align="center" h="100%" justify="space-between">
              {card.icon}

              <Box style={{ textAlign: "center" }}>
                <Text fw={500}>{card.title}</Text>
                <Text size="sm" c="dimmed">
                  {card.description}
                </Text>
              </Box>

              <Button variant="light" fullWidth mt="md" radius="md" onClick={card.onClick}>
                {card.label}
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
