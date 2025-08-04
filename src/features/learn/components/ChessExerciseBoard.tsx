import { Box, Paper } from "@mantine/core";
import type { Key } from "chessground/types";
import { Chessground } from "@/chessground/Chessground";
import { TreeStateProvider } from "@/common/components/TreeStateContext";
import { chessboard } from "@/styles/Chessboard.css";
import { positionFromFen } from "@/utils/chessops";

interface ChessExerciseBoardProps {
  fen: string;
  onMove?: (orig: string, dest: string) => void;
  lastCorrectMove?: { from: string; to: string } | null;
  showingCorrectAnimation?: boolean;
  readOnly?: boolean;
}

export function ChessExerciseBoard({
  fen,
  onMove,
  lastCorrectMove = null,
  showingCorrectAnimation = false,
  readOnly = false,
}: ChessExerciseBoardProps) {
  const [pos] = positionFromFen(fen);
  const turn = pos?.turn || "white";

  return (
    <Paper p="md" withBorder>
      <Box className={chessboard}>
        <Chessground
          fen={fen}
          orientation="white"
          turnColor={turn}
          movable={{
            free: !readOnly,
            color: !readOnly ? turn : undefined,
            events: {
              after: onMove,
            },
          }}
          animation={{ enabled: true }}
          coordinates={true}
          highlight={{
            lastMove: true,
            check: true,
          }}
          drawable={{
            enabled: true,
            visible: true,
            defaultSnapToValidMove: true,
            autoShapes:
              showingCorrectAnimation && lastCorrectMove
                ? [
                    {
                      orig: lastCorrectMove.from as Key,
                      dest: lastCorrectMove.to as Key,
                      brush: "green",
                    },
                  ]
                : [],
          }}
        />
      </Box>
    </Paper>
  );
}

export default function ChessExerciseBoardWithProvider(props: ChessExerciseBoardProps) {
  return (
    <TreeStateProvider>
      <ChessExerciseBoard {...props} />
    </TreeStateProvider>
  );
}
