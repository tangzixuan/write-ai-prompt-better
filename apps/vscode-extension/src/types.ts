/**
 * Shared type definitions for the write-ai-prompt-better VSCode extension.
 *
 * These types describe the context items collected from the editor/terminal/
 * explorer, the AI-assistant skills discovered on disk, the prompt history,
 * the preset phrases, and the postMessage protocol exchanged between the
 * Extension Host and the embedded Webview UI.
 */

/** A single piece of context added to the prompt editor. */
export interface ContextItem {
  id: string;
  type: 'file' | 'terminal' | 'manual' | 'folder' | 'fileRef';
  /** Raw content: code text for `file`/`terminal`, freeform text for `manual`, empty for `folder`/`fileRef`. */
  content: string;
  /** Absolute file/folder path. Present for all types except `manual`. */
  filePath?: string;
  /** Line range marker such as `L12` or `L12-20`. Only set for editor selections. */
  lineRange?: string;
  timestamp: number;
}

/** A discovered AI-assistant skill (Claude Code / Cursor / Copilot / Cline / Windsurf). */
export interface SkillItem {
  /** Skill name from frontmatter `name:`, falling back to the filename/dirname. */
  name: string;
  /** Description from frontmatter `description:`. */
  description: string;
  /** Absolute file path; empty string for Copilot inline-text instructions. */
  path: string;
  /** Grouping label, e.g. `Claude Code · 全局` or `Cursor · 项目`. */
  agent: string;
  /** Raw file content including frontmatter. */
  content: string;
}

/** A previously generated prompt snapshot, persisted across sessions. */
export interface HistoryItem {
  id: string;
  /** The fully assembled Markdown prompt. */
  prompt: string;
  /** First ~100 characters of the prompt, stripped of markdown headers. */
  preview: string;
  timestamp: number;
  /** Snapshot of the context items used to generate this prompt. */
  contextItems: ContextItem[];
}

/** A preset phrase shown in the requirements / validation dropdowns. */
export interface PresetPrompt {
  label: string;
  value: string;
}

/** Messages sent from the Webview UI to the Extension Host. */
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'copyToClipboard'; text: string }
  | { type: 'saveHistory'; item: HistoryItem }
  | { type: 'deleteHistoryItem'; id: string }
  | { type: 'clearHistory' }
  | { type: 'savePresets'; presets: PresetPrompt[] }
  | { type: 'saveValidationPresets'; presets: PresetPrompt[] }
  | { type: 'getSkills' }
  | { type: 'openSkillFile'; path?: string }
  | { type: 'removeContextItem'; id: string }
  | { type: 'addManualItem'; content: string }
  | { type: 'setContextItems'; items: ContextItem[] }
  | { type: 'clearContextItems' }
  | { type: 'openEditorPanel' }
  | { type: 'openEditorPanelBeside' };

/** Messages sent from the Extension Host to the Webview UI. */
export type ExtensionMessage =
  | { type: 'syncContextItems'; items: ContextItem[] }
  | { type: 'historyData'; history: HistoryItem[] }
  | { type: 'presetsData'; presets: PresetPrompt[] }
  | { type: 'validationPresetsData'; presets: PresetPrompt[] }
  | { type: 'skillsData'; skills: SkillItem[] }
  | { type: 'clearAll' };
