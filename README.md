# BustImages

**BustImages** is a visual-novel-style bust system for RPG Maker MZ. It can display several character busts at once, move them across the screen, swap their pose and expression independently, and automatically highlight the current message speaker.

## Installation

1. Copy `BustImages.js` into your project's `js/plugins/` folder.
2. Enable **BustImages** in RPG Maker MZ's Plugin Manager.
3. Configure the plugin parameters if your asset folders use names other than the defaults.
4. Add the plugin commands to events through **Event Commands → Plugin Command → BustImages**.

The plugin targets RPG Maker **MZ**.

## Asset layout

Busts are assembled from two transparent PNGs: a pose/base layer and an expression layer. Put them under `img/pictures/busts/` using this structure:

```text
img/
└─ pictures/
   └─ busts/
      └─ Chizuru/                 # Speaker Name / unique bust ID
         ├─ Pose/
         │  └─ ChizuruACasual.png
         └─ Expression/
            └─ ChizuruANeutral.png
```

Use matching image dimensions and alignment for both layers. Enter file names in plugin commands **without** `.png`; for the example above, use `ChizuruACasual` and `ChizuruANeutral`.

The folder named after the speaker is case-sensitive on platforms with case-sensitive file systems, and the **Speaker Name** passed to plugin commands must match it exactly.

## Plugin parameters

| Parameter | Default | Purpose |
| --- | --- | --- |
| Pose folder's name | `Pose` | Folder containing each bust's base/pose images. |
| Expression folder's name | `Expression` | Folder containing expression overlay images. |
| Window padding used for busts | `0%` | Horizontal padding applied when calculating preset positions. |

## Commands

### Show Busts

Creates or shows a bust using the selected pose and expression, then moves it to the selected position.

- **Speaker Name (ID):** the bust's unique ID and its folder name.
- **Pose / Face:** filenames without their extension.
- **Position Preset:** choose a screen-relative horizontal position, or enter coordinates.
- **X / Y Position:** coordinates used when using manual placement.

### Move Busts

Moves an already-shown bust to a new preset or coordinate position.

- **Duration** is in milliseconds; the default is `1000` (one second).
- This command does not change the pose or expression.

### Change Busts Assets

Replaces the pose and/or expression of an already-shown bust. The bust keeps its current position.

### Hide Busts

Darkens the bust, slides it 150 pixels toward the selected side, and fades it out. The current fade duration is fixed at 500 ms.

## Speaker highlighting

When a message starts, BustImages compares RPG Maker's message **Speaker Name** with each active bust ID:

- the matching bust is shown at normal brightness;
- all other active busts are tinted darker.

For this to work, set the Show Text command's Speaker field to the same name used for that character's bust (for example, `Chizuru`).

## Position presets

Preset positions calculate a horizontal location from the game resolution and the expression image width. The available values are intended as five evenly spaced screen positions. Because the current implementation treats the preset value `0` as manual placement, use explicit **X** and **Y** coordinates when you need a reliably left-aligned bust.

## Current scope

Version 0.1 provides static layered busts, movement, fading, and speaker tinting. Animated facial parts, additional transition effects, scaling, and more robust error handling are not yet included.

## Author

Created by dreais. Project URL: <https://github.com/dreais/BustImages>
