# Pawn Appétit

## v0.1.0-alpha

### ✨ Features
- **Spotlight Search** for quick access
- **Personal Card Ratings Panel**
  - Added personal rating components
  - Improved overview and openings panels with filters
  - Fixed timezone ISO bug
  - Removed incorrect ELO averaging across rating systems
- **Translation Support**
  - Added **Armenian**
  - Completed **Russian**
- **File System**
  - Added directory and file creation checks in main logic

### 🛠 Improvements & Refactors
- **Keybindings**
  - Renamed `keybinds` → `keybindings` across the codebase
  - Replaced `Ctrl` with `Mod` for cross-platform support
- **GameNotation**
  - Improved component structure and variation handling
- **Chess.com Integration**
  - Refactored stats retrieval and TCN decoding
- **Report Creation**
  - Refactored logic and UI handling
- **General**
  - Updated dependencies
  - Linted code and fixed build issues

### 🐛 Fixes
- **Performance**
  - Prevented event spam during frequent updates
  - Fixed infinite loop in `promoteToMainline`
- **UI Fixes**
  - Improved `SettingsPage` layout
  - Fixed PGN import and report progress bar
  - Fixed crash on multiple *View Solution* in puzzles
  - Improved puzzle caching and error handling
  - Fixed hotkeys and tab navigation on board
  - Fixed percentage calculation in `AccountCard` for zero games
  - Remembered report generation form state

### 📚 Documentation
- Improved `README` formatting
- Added build instructions
- Added `readme-updater` script for translation progress
