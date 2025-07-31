import { ActionIcon, Group } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { memo, useContext } from "react";
import { useStore } from "zustand";
import { keyMapAtom } from "@/state/keybindings";
import { TreeStateContext } from "./TreeStateContext";

function MoveControls({ readOnly }: { readOnly?: boolean }) {
  const store = useContext(TreeStateContext)!;
  const next = useStore(store, (s) => s.goToNext);
  const previous = useStore(store, (s) => s.goToPrevious);
  const start = useStore(store, (s) => s.goToStart);
  const end = useStore(store, (s) => s.goToEnd);
  const deleteMove = useStore(store, (s) => s.deleteMove);
  const startBranch = useStore(store, (s) => s.goToBranchStart);
  const endBranch = useStore(store, (s) => s.goToBranchEnd);
  const nextBranch = useStore(store, (s) => s.nextBranch);
  const previousBranch = useStore(store, (s) => s.previousBranch);
  const nextBranching = useStore(store, (s) => s.nextBranching);
  const previousBranching = useStore(store, (s) => s.previousBranching);

  const keyMap = useAtomValue(keyMapAtom);
  useHotkeys([
    [keyMap.PREVIOUS_MOVE.keys, previous],
    [keyMap.NEXT_MOVE.keys, next],
    [keyMap.GO_TO_START.keys, start],
    [keyMap.GO_TO_END.keys, end],
    [keyMap.DELETE_MOVE.keys, readOnly ? () => {} : () => deleteMove()],
    [keyMap.GO_TO_BRANCH_START.keys, startBranch],
    [keyMap.GO_TO_BRANCH_END.keys, endBranch],
    [keyMap.NEXT_BRANCH.keys, nextBranch],
    [keyMap.PREVIOUS_BRANCH.keys, previousBranch],
    [keyMap.NEXT_BRANCHING.keys, nextBranching],
    [keyMap.PREVIOUS_BRANCHING.keys, previousBranching],
  ]);

  return (
    <Group grow gap="xs">
      <ActionIcon variant="default" size="lg" onClick={start}>
        <IconChevronsLeft />
      </ActionIcon>
      <ActionIcon variant="default" size="lg" onClick={previous}>
        <IconChevronLeft />
      </ActionIcon>
      <ActionIcon variant="default" size="lg" onClick={next}>
        <IconChevronRight />
      </ActionIcon>
      <ActionIcon variant="default" size="lg" onClick={end}>
        <IconChevronsRight />
      </ActionIcon>
    </Group>
  );
}

export default memo(MoveControls);
