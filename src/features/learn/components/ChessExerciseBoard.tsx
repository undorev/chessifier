import { Box, Paper } from "@mantine/core";
import { Chessground } from "@/chessground/Chessground";
import { TreeStateProvider } from "@/common/components/TreeStateContext";
import { chessboard } from "@/styles/Chessboard.css";
import { calculateValidMoves } from "@/utils/chess-engine";
import { positionFromFen } from "@/utils/chessops";

interface ChessExerciseBoardProps {
  fen: string;
  onMove?: (orig: string, dest: string) => void;
  readOnly?: boolean;
}

export function ChessExerciseBoard({ fen, onMove, readOnly = false }: ChessExerciseBoardProps) {
  const [pos] = positionFromFen(fen);
  const turn = pos?.turn || "white";

  const dests = calculateValidMoves(fen);

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
            showDests: true,
            dests,
            events: {
              after: onMove,
            },
          }}
          animation={{ enabled: true }}
          coordinates={true}
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
