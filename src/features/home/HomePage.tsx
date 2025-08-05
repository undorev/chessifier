import { Box, Button, Card, Group, Image, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconBook, IconChess, IconCpu, IconDatabase, IconPuzzle, IconUsers } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import Chessboard from "@/common/components/icons/Chessboard";
import { activeTabAtom, tabsAtom } from "@/state/atoms";
import { genID, type Tab } from "@/utils/tabs";

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [_tabs, setTabs] = useAtom(tabsAtom);
  const [_activeTab, setActiveTab] = useAtom(activeTabAtom);

  const PLAY_CHESS = {
    icon: <IconChess size={50} />,
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
      navigate({ to: "/boards" });
    },
  };

  const cards = [
    {
      icon: <IconBook size={50} />,
      title: t("Home.Card.Learn.Title"),
      description: t("Home.Card.Learn.Desc"),
      label: t("Home.Card.Learn.Button"),
      onClick: () => {
        navigate({ to: "/learn" });
      },
    },
    {
      icon: <Chessboard size={50} />,
      title: t("Home.Card.Analyze.Title"),
      description: t("Home.Card.Analyze.Desc"),
      label: t("Home.Card.Analyze.Button"),
      onClick: () => {
        const uuid = genID();
        setTabs((prev: Tab[]) => {
          return [
            ...prev,
            {
              value: uuid,
              name: t("Home.Card.Analyze.Title"),
              type: "analysis",
            },
          ];
        });
        setActiveTab(uuid);
        navigate({ to: "/boards" });
      },
    },
    {
      icon: <IconDatabase size={50} />,
      title: t("Home.Card.Database.Title"),
      description: t("Home.Card.Database.Desc"),
      label: t("Home.Card.Database.Button"),
      onClick: () => {
        navigate({ to: "/databases" });
      },
    },
    {
      icon: <IconCpu size={50} />,
      title: t("Home.Card.Engine.Title"),
      description: t("Home.Card.Engine.Desc"),
      label: t("Home.Card.Engine.Button"),
      onClick: () => {
        navigate({ to: "/engines" });
      },
    },
    {
      icon: <IconPuzzle size={50} />,
      title: t("Home.Card.Puzzle.Title"),
      description: t("Home.Card.Puzzle.Desc"),
      label: t("Home.Card.Puzzle.Button"),
      onClick: () => {
        navigate({ to: "/boards" });
      },
    },
    {
      icon: <IconUsers size={50} />,
      title: t("Home.Card.Account.Title"),
      description: t("Home.Card.Account.Desc"),
      label: t("Home.Card.Account.Button"),
      onClick: () => {
        navigate({ to: "/accounts" });
      },
    },
  ];

  return (
    <Stack p="md">
      <Card shadow="sm" p="lg" radius="md" withBorder key={PLAY_CHESS.title}>
        <Group>
          <Box flex={1} pl="xl">
            <Title order={1} fz="50px" fw={700}>
              Welcome to Chessifier
            </Title>
            <Text size="md" c="dimmed">
              Your Ultimate Chess Analysis and Training Platform
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

              <Button variant="light" fullWidth radius="md" onClick={card.onClick}>
                {card.label}
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
