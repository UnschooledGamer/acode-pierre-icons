const settings = acode.require('settings');
import plugin from "../plugin.json"
let icons;

/**
 * @author (Originally modified) SEBASTIAN JN <https://github.com/sebastianjnuwu> (Thanks)
 * @param {string} selector 
 * @param {string} iconFileName
 * @returns {string}
 */
function iconCSSStyleBlock(selector, iconFileName) {
  return `${selector}::before {
  display: inline-block;
  content: '' !important;
  background-image: url(https://localhost/__cdvfile_files-external__/plugins/${plugin.id}/icons/${iconFileName.replace(".svg", "")}.svg) !important;
  background-size: contain;
  background-repeat: no-repeat;
  height: 1em;
  width: 1em;
  }`;
}

const FOLDER_STYLE_SELECTORS = [
  {
    selector: `.list.collapsible.hidden > div[data-type="root"] > .icon.folder`,
    icon: (themeIcons) => themeIcons.folder,
  },
  {
    selector: `.list.collapsible > div[data-type="root"] > .icon.folder`,
    icon: () => "folder-open-duo",
  },
  {
    selector: `.list.collapsible.hidden > div.tile[data-name][data-type="dir"] > .icon.folder`,
    icon: (themeIcons) => themeIcons.folder,
  },
  {
    selector: `.list.collapsible > div.tile[data-name][data-type="dir"] > .icon.folder`,
    icon: () => "folder-open-duo",
  },
  {
    selector: `#file-browser > ul > li.tile[type="dir"]  > .icon.folder`,
    icon: (themeIcons) => themeIcons.folder,
  },
  {
    selector: `#file-browser > ul > li.tile[type="directory"]  > .icon.folder`,
    icon: (themeIcons) => themeIcons.folder,
  },
];

function buildFolderStyle(themeIcons) {
  return FOLDER_STYLE_SELECTORS.map(({ selector, icon }) =>
    iconCSSStyleBlock(selector, icon(themeIcons)),
  ).join("\n");
}

function buildFileStyle(themeIcons) {
  const modeEntries = Object.entries(themeIcons?.modes || {});
  const modeFileNames = modeEntries.reduce((acc, [modeName, mode]) => {
    const modeNames = mode?.fileNames || {};
    const firstIconName = Object.values(modeNames)[0];

    for (const [fileName, iconName] of Object.entries(modeNames)) {
      acc[fileName] = iconName;
    }

    if (firstIconName) {
      acc[modeName] = firstIconName;
    }

    return acc;
  }, {});

  const fileTypes = Object.entries({
    ...themeIcons.fileExtensions,
    ...themeIcons.fileNames,
    ...modeFileNames,
  });

  return iconCSSStyleBlock(`.file.file_type_default`, themeIcons.file) + fileTypes
    .map(([key, value]) => {
      const iconFileNameFromIconDefinition = themeIcons?.iconDefinitions?.[value]?.iconPath?.slice(2);
      // escape special characters in key for CSS selector to \
      const escapedKey = key.replace(/([^\w-])/g, "\\$1");
      const escapedValue = value.replace(/([^\w-])/g, "\\$1");
      const iconFileName = iconFileNameFromIconDefinition || value;
      const keySelectorStyle = iconCSSStyleBlock(`.file.file_type_${escapedKey}`, iconFileName);
      if (escapedValue === escapedKey) return keySelectorStyle;
      return keySelectorStyle + iconCSSStyleBlock(`.file.file_type_${escapedValue}`, iconFileName);
    })
    .join("\n");
}

function buildThemeStyle(themeIcons) {
  return [buildFolderStyle(themeIcons), `/* File Styles */`, buildFileStyle(themeIcons)].join("\n");
}

async function loadTheme(themeName) {
  const normalizedTheme = themeName.toLowerCase();
  const module = await import(
    `https://localhost/__cdvfile_files-external__/plugins/${plugin.id}/icons/theme-${normalizedTheme}.json`,
    { with: { type: "json" } },
  );
  icons = module.default;
  return icons;
}

function getMappedMode(modes, key) {
  if (!modes || !key) return null;

  const lowerKey = key.toLowerCase();
  for (const [modeName, mode] of Object.entries(modes)) {
    const names = mode?.fileNames || {};
    const matchedName = Object.keys(names).find((x) => x.toLowerCase() === lowerKey);
    if (matchedName) return modeName;
  }

  return null;
}

function get_type(filename) {
  const baseFilename = filename.split(/[\\/]/).pop() || filename;
  const normalizedFilename = baseFilename.toLowerCase();
  const names = normalizedFilename.split(".");
  names.shift();
  const extension = names.join(".");

  const mode = getMappedMode(icons?.modes, baseFilename);
  if (mode) return mode;

  const byExtension = icons?.fileExtensions?.[extension];
  if (byExtension) return byExtension;

  const byFileNameInExtensions = icons?.fileExtensions?.[baseFilename];
  if (byFileNameInExtensions) return byFileNameInExtensions;

  if (icons?.fileExtensions) {
    const lowerExtension = extension.toLowerCase();
    const lowerBaseFilename = baseFilename.toLowerCase();
    const matchedExtensionKey = Object.keys(icons.fileExtensions).find((x) => x.toLowerCase() === lowerExtension);
    if (matchedExtensionKey) return icons.fileExtensions[matchedExtensionKey];

    const matchedFileNameKey = Object.keys(icons.fileExtensions).find((x) => x.toLowerCase() === lowerBaseFilename);
    if (matchedFileNameKey) return icons.fileExtensions[matchedFileNameKey];
  }

  return extension || normalizedFilename;
}

acode.require("helpers").getIconForFile = (x) => {
  const { getModeForPath } = ace.require("ace/ext/modelist");
  const { name } = getModeForPath(x);
  const z = name;
  const y = get_type(x);
  return `file file_type_default file_type_${z} file_type_${y}`;
};

class IconsPlugin {
  async init() {

    if(!settings.value[`${plugin.id}`]?.["pierre-icons-theme"]){
      settings.value[`${plugin.id}`] = {
        "pierre-icons-theme": "Complete"
      }
      settings.update(false);
    }

    await loadTheme("Complete");

    if (settings.value[`${plugin.id}`]?.["pierre-icons-theme"] !== "Complete" && ["Minimal", "Default"].includes(settings.value[`${plugin.id}`]?.["pierre-icons-theme"])) {

      window.toast(`Loading selected icons theme ${settings.value[`${plugin.id}`]["pierre-icons-theme"]}`, 2000);

      await loadTheme(settings.value[`${plugin.id}`]["pierre-icons-theme"]);

    }

    const style = document.createElement("style");
    style.id = `${plugin.id}-style`;
    style.innerHTML = buildThemeStyle(icons);
    document.head.appendChild(style);

    this.style = style;
  }

  async destroy() {
    this.style.remove();
    settings.off(`update:${plugin.id}.pierre-icons-theme`);
  }
}

if (window.acode) {
  const PierreIconsPlugin = new IconsPlugin();

  acode.setPluginInit(plugin.id, () => PierreIconsPlugin.init(), {
    list: [
      {
        key: "pierre-icons-theme",
        text: "Select Icons Theme for Pierre Icons Plugin",
        select: ["Complete", "Minimal", "Default"],
        value: settings.value[`${plugin.id}`]?.["pierre-icons-theme"] || "Complete",
      }
    ],
    cb: async (key, value) => {
      console.log(`Selected theme: ${value}`, `Current theme in settings: ${settings.value[`${plugin.id}`]?.[key]}`);
      if (value === settings.value[`${plugin.id}`]?.[key]) return;

      if (["Minimal", "Default", "Complete"].includes(value)) {

        window.toast(`Loading selected icons theme ${value}`, 2000);

        await loadTheme(value);

        PierreIconsPlugin.style.innerHTML = buildThemeStyle(icons);
        PierreIconsPlugin.style.remove();
        document.head.appendChild(PierreIconsPlugin.style);

        window.toast(`Loaded selected icons theme ${value}`, 2000);

        settings.value[`${plugin.id}`][key] = value;

      }
      settings.update(false);
    }
  });

  acode.setPluginUnmount(plugin.id, () => PierreIconsPlugin.destroy());
}