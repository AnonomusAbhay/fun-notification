import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  themeVolume: 0.8,
  mutedThemes: [],
  doNotDisturb: false,
  serverUrl: ''
};

let filePath = null;

function getFilePath() {
  if (!filePath) {
    try {
      // app.getPath('userData') retrieves the system-specific user data directory
      const userData = app.getPath('userData');
      filePath = path.join(userData, 'settings.json');
    } catch (e) {
      // Fallback in case app path is queried outside initialized Electron context
      filePath = path.join(process.cwd(), 'settings.json');
    }
  }
  return filePath;
}

/**
 * Reads settings from the local JSON store. Falls back to defaults if the file does not exist.
 * @returns {typeof DEFAULT_SETTINGS}
 */
export function readSettings() {
  const file = getFilePath();
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('[SettingsStore] Failed to read settings file, falling back to defaults:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Merges and writes settings to the local JSON store.
 * @param {Partial<typeof DEFAULT_SETTINGS>} settings 
 * @returns {typeof DEFAULT_SETTINGS} The updated settings object.
 */
export function writeSettings(settings) {
  const file = getFilePath();
  try {
    const current = readSettings();
    const updated = { ...current, ...settings };
    fs.writeFileSync(file, JSON.stringify(updated, null, 2), 'utf8');
    console.log('[SettingsStore] Settings successfully persisted to:', file);
    return updated;
  } catch (err) {
    console.error('[SettingsStore] Failed to write settings file:', err.message);
    return { ...DEFAULT_SETTINGS, ...settings };
  }
}
