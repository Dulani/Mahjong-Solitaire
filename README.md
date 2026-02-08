# Mahjong Solitaire – 3D Overhaul
#### Author: Bocaletto Luca

[![Made with HTML5](https://img.shields.io/badge/Made%20with-HTML5-E34F26?logo=html5)](https://www.w3.org/html/)
[![Made with CSS3](https://img.shields.io/badge/Made%20with-CSS3-1572B6?logo=css3)](https://www.w3.org/Style/CSS/)
[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-F7DF1E?logo=javascript)](https://developer.mozilla.org/docs/Web/JavaScript)

## Overview

Mahjong Solitaire – is a modern, 3D, fully responsive single‑player web game. This version features procedurally generated SVG tile graphics, a true 3D pyramid layout with physical thickness, and advanced camera controls. The game allows players to select their starting level and adjust the viewing angle for a more immersive experience.

## Features

- **High-Quality SVG Graphics:** Tiles use scalable vector graphics (Characters, Bamboos, Circles) that are sharp at any zoom level.
- **3D Perspective Engine:** A true 3D environment using CSS `preserve-3d`. Tiles have 20px thickness and logical stacking.
- **Dynamic Camera Controls:** Adjust Tilt (X), Rotation (Y), Rotation (Z), and Zoom using interactive sliders in the sidebar.
- **Level Selector:** Choose your starting level (2+) from the sidebar. The game dynamically generates a tapering pyramid layout based on the selected level.
- **Responsive Design:** The virtual 2000x1600 game space automatically scales to fit your browser window.
- **Collapsible Sidebar:** All controls and instructions are neatly tucked into a sidebar, providing a clean viewport for gameplay.
- **Free Tile Detection:** Enhanced rules account for 3D stacking. A tile is free if no tile is on top and at least one horizontal side is open.
- **Debug Mode:** A "Highlight Free Tiles" toggle helps new players identify valid moves.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/bocaletto-luca/Mahjong-Solitaire.git
   ```

2. **Run a local server:**

   You can use a simple Python server:
   ```bash
   python3 -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

## Usage

**Goal:** Remove all matching pairs of tiles from the board.

**Rules:**
- A tile is **free** if it has no tile on top and its left or right side is open.
- Click two matching free tiles to remove them.
- Use the **Camera & Debug** section in the sidebar to rotate the board or zoom in/out.

## Contributing
Contributions, bug reports, and feature suggestions are welcome! Feel free to fork the repository and submit pull requests.

#### Enjoy Game - By Bocaletto Luca

#### License: GPLv3
