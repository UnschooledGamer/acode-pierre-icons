<div align="center">
<img alt="plugin_status" src="https://img.shields.io/badge/plugin_status-finished-a6da95?style=for-the-badge&labelColor=24273a" />
<br/>

</div>

<h1 align="center">Pierre Icons (Acode Plugin)</h1>

Pierre Icons is an icon theme plugin (from: https://github.com/pierrecomputer/vscode-icons) for Acode that maps file names and extensions to themed SVG icons.

## Themes

The plugin ships with 3 selectable themes:
1. Complete: largest icon coverage, includes framework/tooling icons and colored variants.
2. Default: balanced set, built from Minimal + Default theme configs.
3. Minimal: core file/folder and common file types.

Theme source files:
1. [scripts/themes/minimal.mjs](scripts/themes/minimal.mjs)
2. [scripts/themes/default.mjs](scripts/themes/default.mjs)
3. [scripts/themes/complete.mjs](scripts/themes/complete.mjs)

Generated outputs:
1. [icons/theme-minimal.json](icons/theme-minimal.json)
2. [icons/theme-default.json](icons/theme-default.json)
3. [icons/theme-complete.json](icons/theme-complete.json)
---

The repository includes:
1. Source SVG assets.
2. Theme configuration files by tier.
3. Build scripts that generate processed icon files and theme JSON.
4. Plugin runtime logic for icon-class resolution and style generation.

## Build

Install dependencies:

```bash
npm install
```

Generate icon assets + theme JSON:

```bash
npm run build:icons
```

Bundle plugin and create zip:

```bash
npm run build
```

Available scripts are defined in [package.json](package.json).

## How To Add New Icons

Most icons and mappings are synced from the upstream vscode-icons project:
https://github.com/pierrecomputer/vscode-icons

Recommended workflow:
1. Add or update SVGs in `svgs/`. For duo-tone icons, use `class="bg"` and `class="fg"` on paths.
2. Add an entry to the appropriate tier array in `scripts/build-icon-theme.mjs`:

```js
// Single color
{ name: "react", color: color(palette.cyan), fileExtensions: ["jsx", "tsx"] }

// Dual color (fg + bg)
{ name: "lang-python", color: duoColor(palette.blue, palette.yellow), fileExtensions: ["py"] }

// Monochrome (no color property)
{ name: "font", fileExtensions: ["ttf", "otf", "woff", "woff2"] }
```

3. Run `npm run build:icons`.

## Theme Configs And Modes

Modes are generated during theme build from fileNames mappings.

How it works:
1. Build script groups fileNames by icon name and emits theme.modes in generated JSON.
2. Runtime resolves filename using modes first, then extension fallback.
3. This allows filename-specific classes such as file_type_npm for package.json.

Relevant files:
1. [scripts/build-icon-theme.mjs](scripts/build-icon-theme.mjs)
2. [src/main.js](src/main.js)

Generated mode format (example):

```json
{
	"modes": {
		"npm": {
			"fileNames": {
				"package.json": "npm",
				"package-lock.json": "npm"
			}
		}
	}
}
```

## Maintenance

To keep this project healthy over time:
1. Sync icon additions and mapping updates from upstream vscode-icons regularly.
2. Keep naming consistent between [svgs](svgs) filenames and theme config name values.
3. Rebuild assets after every icon/theme change with `npm run build:icons`.
4. Validate generated JSON outputs in [icons](icons) before release.
5. Build and test packaged output with npm run build.
6. Keep color and palette logic centralized in [scripts/palette.mjs](scripts/palette.mjs).
7. Run SVGO through the existing build path instead of manually editing generated icons in [icons](icons).

Release checklist:
1. Run npm run build:icons.
2. Run npm run build.
3. Confirm plugin.zip is generated.
4. Smoke-test theme switching inside Acode.

## License

Plugin's Icon is from https://github.com/pierrecomputer , Only used for representation purposes (I hold no direct legal rights to their Icon).

The Project uses MIT License.

## Credits
1. Plugin's Icon is from https://github.com/pierrecomputer , Only used for representation purposes (I hold no direct legal rights to their Icon).
2. SEBASTIAN JN <https://github.com/sebastianjnuwu> for their reusable iconCSSStyleBlock function.
3. https://github.com/pierrecomputer & It's contributors for Icons, Svg building scripts, Color system, theme config/structures.
