import type { Lesson } from "../LessonsPage";

export const lessons: Lesson[] = [
  {
    id: "chess-pieces",
    title: "Chess Pieces",
    description: "Learn how each chess piece moves and captures on the board.",
    difficulty: "beginner",
    estimatedTime: 10,
    tags: ["pieces", "movement"],
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    content:
      "Each chess piece moves in a unique way. The pawn moves forward one square, but captures diagonally. The knight moves in an L-shape. The bishop moves diagonally. The rook moves horizontally and vertically. The queen combines the power of the bishop and rook. The king moves one square in any direction.",
    exercises: [
      {
        id: "rook-movement",
        title: "The rook",
        description: "It moves in straight lines",
        variations: [
          {
            fen: "8/8/8/8/4R3/8/8/8 w - - 0 1",
            correctMoves: [
              "e4e5",
              "e4e6",
              "e4e7",
              "e4e8",
              "e4e3",
              "e4e2",
              "e4e1",
              "e4d4",
              "e4c4",
              "e4b4",
              "e4a4",
              "e4f4",
              "e4g4",
              "e4h4",
            ],
          },
        ],
      },
      {
        id: "bishop-movement",
        title: "The bishop",
        description: "It moves diagonally",
        variations: [
          {
            fen: "8/8/8/8/4B3/8/8/8 w - - 0 1",
            correctMoves: [
              "e4d5",
              "e4c6",
              "e4b7",
              "e4a8",
              "e4f5",
              "e4g6",
              "e4h7",
              "e4d3",
              "e4c2",
              "e4b1",
              "e4f3",
              "e4g2",
              "e4h1",
            ],
          },
        ],
      },
      {
        id: "queen-movement",
        title: "The queen",
        description: "Queen = rook + bishop",
        variations: [
          {
            fen: "8/8/8/8/4Q3/8/8/8 w - - 0 1",
            correctMoves: [
              "e4e5",
              "e4e6",
              "e4e7",
              "e4e8",
              "e4e3",
              "e4e2",
              "e4e1",
              "e4d4",
              "e4c4",
              "e4b4",
              "e4a4",
              "e4f4",
              "e4g4",
              "e4h4",
              "e4d5",
              "e4c6",
              "e4b7",
              "e4a8",
              "e4f5",
              "e4g6",
              "e4h7",
              "e4d3",
              "e4c2",
              "e4b1",
              "e4f3",
              "e4g2",
              "e4h1",
            ],
          },
        ],
      },
      {
        id: "king-movement",
        title: "The king",
        description: "The most important piece",
        variations: [
          {
            fen: "8/8/8/8/4K3/8/8/8 w - - 0 1",
            correctMoves: ["e4e5", "e4e3", "e4d4", "e4f4", "e4d5", "e4f5", "e4d3", "e4f3"],
          },
        ],
      },
      {
        id: "knight-movement",
        title: "The knight",
        description: "It moves in an L shape",
        variations: [
          {
            fen: "8/8/8/8/4N3/8/8/8 w - - 0 1",
            correctMoves: ["e4d6", "e4f6", "e4c5", "e4g5", "e4c3", "e4g3", "e4d2", "e4f2"],
          },
        ],
      },
      {
        id: "pawn-movement",
        title: "The pawn",
        description: "It moves forward only",
        variations: [
          {
            fen: "8/8/8/8/4P3/8/8/8 w - - 0 1",
            correctMoves: ["e4e5"],
          },
        ],
      },
    ],
  },
  {
    id: "fundamentals",
    title: "Fundamentals",
    description: "Learn the basic rules and checkmate patterns.",
    difficulty: "beginner",
    estimatedTime: 15,
    tags: ["fundamentals", "checkmate"],
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    content:
      "Checkmate is the ultimate goal in chess. It occurs when the king is in check and has no legal moves to escape. In this lesson, you'll learn some basic checkmate patterns and essential rules.",
    exercises: [
      {
        id: "capture",
        title: "Capture",
        description: "Take the enemy pieces",
        variations: [
          {
            fen: "8/8/2k5/8/3n4/6Q1/5B2/4K3 w - - 0 1",
            correctMoves: ["f2d4"],
          },
          {
            fen: "8/8/2k5/8/2b5/Q3N3/8/4K3 w - - 0 1",
            correctMoves: ["e3c4"],
          },
        ],
      },
      {
        id: "protection",
        title: "Protection",
        description: "Keep your pieces safe",
        variations: [
          {
            fen: "8/8/5k1b/8/8/2K1N3/Q7/8 w - - 0 1",
            correctMoves: ["e3c4", "e3g4", "c2d1", "f1g2"],
          },
        ],
      },
      {
        id: "combat",
        title: "Combat",
        description: "Capture and defend pieces",
        variations: [
          {
            fen: "8/8/5k2/2b5/8/4N3/2Q5/2K5 w - - 0 1",
            correctMoves: ["c2c5"],
          },
        ],
      },
      {
        id: "check-in-one",
        title: "Check in one",
        description: "Attack the opponent's king",
        variations: [
          {
            fen: "8/8/8/5k2/1Q6/8/8/2K5 w - - 0 1",
            correctMoves: ["b4b5"],
          },
        ],
      },
      {
        id: "out-of-check",
        title: "Out of check",
        description: "Defend your king",
        variations: [
          {
            fen: "8/8/8/2r1k3/8/8/8/2K5 b - - 0 1",
            correctMoves: ["c1b1", "c1b2", "c1d1", "c1d2"],
          },
          {
            fen: "8/8/8/2r1k3/8/Q7/8/2K5 b - - 0 1",
            correctMoves: ["a3c5"],
          },
          {
            fen: "8/8/8/r3k3/1r6/8/5R2/K7 w - - 0 1",
            correctMoves: ["f2a2"],
          },
        ],
      },
      {
        id: "mate-in-one",
        title: "Mate in one",
        description: "Defeat the opponent's king",
        variations: [
          {
            fen: "7k/6pp/8/8/8/2Q5/8/K7 b - - 0 1",
            correctMoves: ["c3c8"],
          },
        ],
      },
    ],
  },
  {
    id: "intermediate",
    title: "Intermediate",
    description: "Learn fundamental tactical patterns and combinations.",
    difficulty: "intermediate",
    estimatedTime: 20,
    tags: ["tactics", "combinations"],
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    content:
      "Tactics are short-term combinations that lead to a concrete advantage. Common tactical patterns include forks, pins, skewers, and discovered attacks. Mastering these patterns is essential for chess improvement.",
    exercises: [
      {
        id: "board-setup",
        title: "Board setup",
        description: "How the game starts",
        variations: [
          {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1",
            correctMoves: [
              "a2a3",
              "b2b3",
              "c2c3",
              "d2d3",
              "e2e3",
              "f2f3",
              "g2g3",
              "h2h3",
              "b1a3",
              "b1c3",
              "g1f3",
              "g1h3",
            ],
          },
        ],
      },
      {
        id: "castling",
        title: "Castling",
        description: "The special king move",
        variations: [{ fen: "r1bqkbnr/ppp2ppp/2np4/4p3/4P3/3B1N2/PPPP1PPP/RNBQK2R w - - 0 1", correctMoves: ["e1g1"] }],
      },
      {
        id: "en-passant",
        title: "En passant",
        description: "The special pawn move",
        variations: [{ fen: "rnbqkbnr/p1p1pppp/1p6/3pP3/8/8/PPPP1PPP/RNBQKBNR w - d6 0 1", correctMoves: ["e5d6"] }],
      },
      {
        id: "stalemate",
        title: "Stalemate",
        description: "The game is a draw",
        variations: [{ fen: "k7/8/5B2/8/8/3K4/8/1R6 w - - 0 1", correctMoves: ["f6d4"] }],
      },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Master complex tactical patterns and combinations.",
    difficulty: "advanced",
    estimatedTime: 30,
    tags: ["advanced", "tactics", "combinations"],
    fen: "8/8/8/8/8/8/8/8 w - - 0 1",
    content:
      "Advanced tactics involve complex combinations of multiple tactical motifs. These include deflection, decoy, clearance, interference, and zwischenzug (intermediate move). Recognizing these patterns will significantly improve your calculation abilities and overall chess strength.",
    exercises: [
      {
        id: "piece-value",
        title: "Piece value",
        description: "Evaluate piece strength",
        variations: [{ fen: "k7/8/1q1b4/2P5/8/2QK4/8/8 w - - 0 1", correctMoves: ["c5b6"] }],
      },
    ],
  },
];
