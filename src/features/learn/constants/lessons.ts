import type { Lesson } from "../LessonsPage";

export const lessons: Lesson[] = [
  // Chess pieces
  {
    id: "chess-pieces",
    title: "Chess Pieces",
    description: "Learn how each chess piece moves and captures on the board.",
    difficulty: "beginner",
    estimatedTime: 10,
    tags: ["pieces", "movement"],
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    content:
      "Each chess piece moves in a unique way. The pawn moves forward one square, but captures diagonally. The knight moves in an L-shape. The bishop moves diagonally. The rook moves horizontally and vertically. The queen combines the power of the bishop and rook. The king moves one square in any direction.",
    exercises: [
      {
        id: "rook-movement",
        title: "The rook",
        description: "It moves in straight lines",
        fen: "8/8/8/8/4R3/8/8/8 w - - 0 1",
        correctMoves: ["e4e8", "e4e1", "e4a4", "e4h4"],
      },
      {
        id: "bishop-movement",
        title: "The bishop",
        description: "It moves diagonally",
        fen: "8/8/8/8/4B3/8/8/8 w - - 0 1",
        correctMoves: ["e4a8", "e4h7", "e4a1", "e4h1"],
      },
      {
        id: "queen-movement",
        title: "The queen",
        description: "Queen = rook + bishop",
        fen: "8/8/8/8/4Q3/8/8/8 w - - 0 1",
        correctMoves: ["e4e8", "e4e1", "e4a4", "e4h4", "e4a8", "e4h7", "e4a1", "e4h1"],
      },
      {
        id: "king-movement",
        title: "The king",
        description: "The most important piece",
        fen: "8/8/8/8/4K3/8/8/8 w - - 0 1",
        correctMoves: ["e4e5", "e4e3", "e4d4", "e4f4", "e4d5", "e4f5", "e4d3", "e4f3"],
      },
      {
        id: "knight-movement",
        title: "The knight",
        description: "It moves in an L shape",
        fen: "8/8/8/8/4N3/8/8/8 w - - 0 1",
        correctMoves: ["e4d6", "e4f6", "e4c5", "e4g5", "e4c3", "e4g3", "e4d2", "e4f2"],
      },
      {
        id: "pawn-movement",
        title: "The pawn",
        description: "It moves forward only",
        fen: "8/8/8/4P3/8/8/8/8 w - - 0 1",
        correctMoves: ["e4e5"],
      },
    ],
  },

  // Fundamentals
  {
    id: "fundamentals",
    title: "Fundamentals",
    description: "Learn the basic rules and checkmate patterns.",
    difficulty: "beginner",
    estimatedTime: 15,
    tags: ["fundamentals", "checkmate"],
    fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
    content:
      "Checkmate is the ultimate goal in chess. It occurs when the king is in check and has no legal moves to escape. In this lesson, you'll learn some basic checkmate patterns and essential rules.",
    exercises: [
      {
        id: "capture",
        title: "Capture",
        description: "Take the enemy pieces",
        fen: "8/8/8/4p3/4P3/8/8/8 w - - 0 1",
        correctMoves: ["e4e5"],
      },
      {
        id: "protection",
        title: "Protection",
        description: "Keep your pieces safe",
        fen: "8/8/8/4p3/4P3/8/8/8 w - - 0 1",
        correctMoves: ["e4e5"],
      },
      {
        id: "combat",
        title: "Combat",
        description: "Capture and defend pieces",
        fen: "8/8/8/4p3/4P3/8/8/8 w - - 0 1",
        correctMoves: ["e4e5"],
      },
      {
        id: "check-in-one",
        title: "Check in one",
        description: "Attack the opponent's king",
        fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
        correctMoves: ["a1a8"],
      },
      {
        id: "out-of-check",
        title: "Out of check",
        description: "Defend your king",
        fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
        correctMoves: ["f7h7"],
      },
      {
        id: "mate-in-one",
        title: "Mate in one",
        description: "Defeat the opponent's king",
        fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
        correctMoves: ["f7h7"],
      },
    ],
  },

  // Intermediate
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Learn fundamental tactical patterns and combinations.",
    difficulty: "intermediate",
    estimatedTime: 20,
    tags: ["tactics", "combinations"],
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
    content:
      "Tactics are short-term combinations that lead to a concrete advantage. Common tactical patterns include forks, pins, skewers, and discovered attacks. Mastering these patterns is essential for chess improvement.",
    exercises: [
      {
        id: "board-setup",
        title: "Board setup",
        description: "How the game starts",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        correctMoves: [],
      },
      {
        id: "castling",
        title: "Castling",
        description: "The special king move",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        correctMoves: ["e1g1", "e1c1"],
      },
      {
        id: "en-passant",
        title: "En passant",
        description: "The special pawn move",
        fen: "8/8/8/4pP2/8/8/8/8 b - f6 0 1",
        correctMoves: ["e5f6"],
      },
      {
        id: "stalemate",
        title: "Stalemate",
        description: "The game is a draw",
        fen: "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
        correctMoves: [],
      },
    ],
  },

  // Advanced
  {
    id: "advanced",
    title: "Advanced",
    description: "Master complex tactical patterns and combinations.",
    difficulty: "advanced",
    estimatedTime: 30,
    tags: ["advanced", "tactics", "combinations"],
    fen: "r1bqk2r/ppp2ppp/2n2n2/2bpp3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1",
    content:
      "Advanced tactics involve complex combinations of multiple tactical motifs. These include deflection, decoy, clearance, interference, and zwischenzug (intermediate move). Recognizing these patterns will significantly improve your calculation abilities and overall chess strength.",
    exercises: [
      {
        id: "piece-value",
        title: "Piece value",
        description: "Evaluate piece strength",
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        correctMoves: [],
      },
      {
        id: "check-in-two",
        title: "Check in two",
        description: "Two moves to give a check",
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        correctMoves: [],
      },
    ],
  },
];
