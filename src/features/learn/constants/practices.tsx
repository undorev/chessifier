import { IconCrown } from "@tabler/icons-react";
import type { PracticeCategory } from "../PracticePage";

export const practiceCategories: PracticeCategory[] = [
    {
        group: "Checkmates",
        id: "piece-checkmates",
        title: "Piece Checkmates",
        description: "Basic and challenging checkmates",
        icon: <IconCrown size={24} />,
        color: "yellow",
        estimatedTime: 0,
        exercises: [
            {
                id: "mate-queen-rook",
                title: "Queen and rook mate",
                description:
                    "Use your queen and rook to restrict the king and deliver checkmate. Mate in 3 if played perfectly.",
                difficulty: "beginner",
                fen: "8/8/2k5/8/8/4K3/8/Q6R w - - 0 1",
                points: 10,
                timeLimit: 30,
                stepsCount: 3,
            },
            {
                id: "mate-two-rooks-mate",
                title: "Two rooks mate",
                description: "Use your rooks to restrict the king and deliver checkmate. Mate in 4 if played perfectly.",
                fen: "8/8/3k4/8/8/4K3/8/R6R w - - 0 1",
                difficulty: "beginner",
                points: 10,
                timeLimit: 30,
                stepsCount: 4,
            },
            {
                id: "mate-queen-and-bishop-mate",
                title: "Queen and bishop mate",
                description:
                    "Use your queen and bishop to restrict the king and deliver checkmate. Mate in 5 if played perfectly.",
                fen: "8/8/3k4/8/8/2QBK3/8/8 w - - 0 1",
                difficulty: "beginner",
                points: 10,
                timeLimit: 30,
                stepsCount: 5,
            },
            {
                id: "mate-queen-and-knight-mate",
                title: "Queen and knight mate",
                description:
                    "Use your queen and knight to restrict the king and deliver checkmate. Mate in 5 if played perfectly.",
                fen: "8/8/3k4/8/8/2QNK3/8/8 w - - 0 1",
                difficulty: "beginner",
                points: 10,
                timeLimit: 30,
                stepsCount: 5,
            },
            {
                id: "mate-queen-mate",
                title: "Queen mate",
                description:
                    "Use your queen to restrict the king, force it to the edge of the board and deliver checkmate. The queen can't do it alone, so use your king to help. Mate in 6 if played perfectly.",
                fen: "8/8/3k4/8/8/4K3/8/4Q3 w - - 0 1",
                difficulty: "beginner",
                points: 10,
                timeLimit: 30,
                stepsCount: 6,
            },
            {
                id: "mate-rook-mate",
                title: "Rook mate",
                description:
                    "Use your rook to restrict the king, force it to the edge of the board and deliver checkmate. The rook can't do it alone, so use your king to help. Mate in 11 if played perfectly.",
                fen: "8/8/3k4/8/8/4K3/8/4R3 w - - 0 1",
                difficulty: "beginner",
                points: 10,
                timeLimit: 30,
                stepsCount: 11,
            },
        ],
    },
]