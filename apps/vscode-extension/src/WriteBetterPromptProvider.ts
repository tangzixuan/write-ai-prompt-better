import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  ContextItem,
  ExtensionMessage,
  HistoryItem,
  PresetPrompt,
  SkillItem,
  WebviewMessage,
} from './types';
import { t, getWebviewMessages, getDefaultPresets, getDefaultValidationPresets, getSkillAgentLabels, getLang, setLang } from './i18n';

/** Built-in requirement presets (seed only — overridden by UI-managed presets). */
function buildDefaultPresets(): PresetPrompt[] {
  return getDefaultPresets();
}

/** Built-in validation presets. */
function buildDefaultValidationPresets(): PresetPrompt[] {
  return getDefaultValidationPresets();
}

/** Generate a short unique id shared by the provider and the command layer. */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Generate a CSP nonce. */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

type PostFn = (msg: ExtensionMessage) => Thenable<boolean>;

/**
 * Core provider. Implements `WebviewViewProvider` for the sidebar view and
 * manages any number of standalone `WebviewPanel` editor windows. Context
 * items and history live in the extension process and are broadcast to every
 * open view so that all windows stay in sync.
 */
export class WriteBetterPromptProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = 'writeBetterPrompt.panel';

  private _view?: vscode.WebviewView;
  private _editorPanels: vscode.WebviewPanel[] = [];

  /** Centralised context items shared across all views. */
  private _contextItems: ContextItem[] = [];
  /** Prompt history persisted in globalState (no cap). */
  private _history: HistoryItem[] = [];
  private _presets: PresetPrompt[] = [];
  private _validationPresets: PresetPrompt[] = [];
  /** Cached skill scan results. Lazily populated; force-refreshed on explicit requests. */
  private _skills: SkillItem[] = [];
  /** Whether the user has customised presets via the UI (true) or uses defaults/settings.json (false). */
  private _presetsCustom = false;
  private _validationPresetsCustom = false;

  private readonly _disposables: vscode.Disposable[] = [];

  constructor(private readonly _context: vscode.ExtensionContext) {}

  // ---------------------------------------------------------------- persistence

  /** Load persisted state. Call once during activation. */
  public async loadState(): Promise<void> {
    this._history = this._context.globalState.get<HistoryItem[]>('wbp.history') ?? [];

    // Restore language preference (defaults to English when not set).
    const storedLang = this._context.globalState.get<'en' | 'zh-cn'>('wbp.lang');
    setLang(storedLang ?? 'en');

    const uiPresets = this._context.globalState.get<PresetPrompt[]>('wbp.presets');
    if (uiPresets) {
      this._presets = uiPresets;
      this._presetsCustom = true;
    } else {
      this._presets = this._getSettingsPresets();
    }

    const uiValPresets = this._context.globalState.get<PresetPrompt[]>('wbp.validationPresets');
    if (uiValPresets) {
      this._validationPresets = uiValPresets;
      this._validationPresetsCustom = true;
    } else {
      this._validationPresets = buildDefaultValidationPresets();
    }
  }

  /** Seed presets from settings.json (only used when no UI-managed presets exist). */
  private _getSettingsPresets(): PresetPrompt[] {
    const config = vscode.workspace.getConfiguration('writeBetterPrompt');
    const presets = config.get<PresetPrompt[]>('presets');
    return presets && presets.length > 0 ? presets : buildDefaultPresets();
  }

  // ---------------------------------------------------------------- view/panel

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'media')],
    };
    webviewView.webview.html = this._getHtml(webviewView.webview, false);

    const post: PostFn = (msg) => webviewView.webview.postMessage(msg);
    webviewView.webview.onDidReceiveMessage(
      (msg) => { void this._handleMessage(msg as WebviewMessage, post); },
      null,
      this._disposables,
    );
    webviewView.onDidDispose(() => { this._view = undefined; }, null, this._disposables);
  }

  /** Open a new standalone editor panel (split beside the active column). */
  public openEditorPanel(viewColumn: vscode.ViewColumn = vscode.ViewColumn.Beside): void {
    const panel = vscode.window.createWebviewPanel(
      WriteBetterPromptProvider.viewType + '.editor',
      'write-ai-prompt-better',
      viewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, 'media')],
      },
    );
    panel.iconPath = vscode.Uri.joinPath(this._context.extensionUri, 'media', 'icon.svg');
    panel.webview.html = this._getHtml(panel.webview, true);

    const post: PostFn = (msg) => panel.webview.postMessage(msg);
    panel.webview.onDidReceiveMessage(
      (msg) => { void this._handleMessage(msg as WebviewMessage, post); },
      null,
      this._disposables,
    );
    panel.onDidDispose(
      () => { this._editorPanels = this._editorPanels.filter((p) => p !== panel); },
      null,
      this._disposables,
    );
    this._editorPanels.push(panel);
  }

  // ---------------------------------------------------------------- public API

  /** Add a context item from a command (editor/terminal/explorer right-click). */
  public addContextItem(item: ContextItem): void {
    this._contextItems.push(item);
    this._broadcast({ type: 'syncContextItems', items: this._contextItems });
  }

  /** Clear all context items and reset every view's private state too. */
  public clearAll(): void {
    this._contextItems = [];
    this._broadcast({ type: 'syncContextItems', items: [] });
    this._broadcast({ type: 'clearAll' });
  }

  // ---------------------------------------------------------------- messaging

  /** Broadcast a message to the sidebar view and every editor panel. */
  private _broadcast(msg: ExtensionMessage): void {
    this._view?.webview.postMessage(msg);
    for (const panel of this._editorPanels) {
      panel.webview.postMessage(msg);
    }
  }

  /** Send the full current state (including auto-scanned skills) to a freshly opened view. */
  private async _initWebview(post: PostFn): Promise<void> {
    post({ type: 'presetsData', presets: this._presets });
    post({ type: 'validationPresetsData', presets: this._validationPresets });
    post({ type: 'historyData', history: this._history });
    post({ type: 'syncContextItems', items: this._contextItems });
    const skills = await this._scanSkills();
    post({ type: 'skillsData', skills });
  }

  /** Shared message handler used by both the sidebar view and editor panels. */
  private async _handleMessage(message: WebviewMessage, post: PostFn): Promise<void> {
    switch (message.type) {
      case 'ready':
        await this._initWebview(post);
        break;

      case 'copyToClipboard':
        await vscode.env.clipboard.writeText(message.text);
        break;

      case 'saveHistory':
        this._history.unshift(message.item);
        await this._context.globalState.update('wbp.history', this._history);
        this._broadcast({ type: 'historyData', history: this._history });
        break;

      case 'deleteHistoryItem':
        this._history = this._history.filter((h) => h.id !== message.id);
        await this._context.globalState.update('wbp.history', this._history);
        this._broadcast({ type: 'historyData', history: this._history });
        break;

      case 'clearHistory':
        this._history = [];
        await this._context.globalState.update('wbp.history', this._history);
        this._broadcast({ type: 'historyData', history: this._history });
        break;

      case 'savePresets':
        this._presets = message.presets;
        this._presetsCustom = true;
        await this._context.globalState.update('wbp.presets', this._presets);
        this._broadcast({ type: 'presetsData', presets: this._presets });
        break;

      case 'saveValidationPresets':
        this._validationPresets = message.presets;
        this._validationPresetsCustom = true;
        await this._context.globalState.update('wbp.validationPresets', this._validationPresets);
        this._broadcast({ type: 'validationPresetsData', presets: this._validationPresets });
        break;

      case 'getSkills': {
        const skills = await this._scanSkills(/* force */ true);
        post({ type: 'skillsData', skills });
        break;
      }

      case 'openSkillFile':
        if (message.path) {
          try {
            const doc = await vscode.workspace.openTextDocument(message.path);
            await vscode.window.showTextDocument(doc);
          } catch {
            vscode.window.showErrorMessage(t('errorOpenSkill', message.path));
          }
        }
        break;

      case 'removeContextItem':
        this._contextItems = this._contextItems.filter((i) => i.id !== message.id);
        this._broadcast({ type: 'syncContextItems', items: this._contextItems });
        break;

      case 'addManualItem': {
        const item: ContextItem = {
          id: genId(),
          type: 'manual',
          content: message.content,
          timestamp: Date.now(),
        };
        this._contextItems.push(item);
        this._broadcast({ type: 'syncContextItems', items: this._contextItems });
        break;
      }

      case 'setContextItems':
        this._contextItems = message.items;
        this._broadcast({ type: 'syncContextItems', items: this._contextItems });
        break;

      case 'clearContextItems':
        this._contextItems = [];
        this._broadcast({ type: 'syncContextItems', items: [] });
        break;

      case 'openEditorPanel':
      case 'openEditorPanelBeside':
        this.openEditorPanel(vscode.ViewColumn.Beside);
        break;

      case 'changeLanguage':
        setLang(message.lang, async (lang) => {
          await this._context.globalState.update('wbp.lang', lang);
        });
        // Regenerate default presets for the new language (skip user-customised ones).
        if (!this._presetsCustom) {
          this._presets = this._getSettingsPresets();
        }
        if (!this._validationPresetsCustom) {
          this._validationPresets = buildDefaultValidationPresets();
        }
        // Refresh every open view so all UI text switches immediately.
        if (this._view) {
          this._view.webview.html = this._getHtml(this._view.webview, false);
        }
        for (const panel of this._editorPanels) {
          panel.webview.html = this._getHtml(panel.webview, true);
        }
        break;
    }
  }

  // ---------------------------------------------------------------- skill scan

  /** Discover AI-assistant skills across global and workspace locations. Results are cached; pass `force` to re-scan. */
  private async _scanSkills(force = false): Promise<SkillItem[]> {
    if (!force && this._skills.length > 0) return this._skills;
    const skills: SkillItem[] = [];
    const home = os.homedir();
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    const L = getSkillAgentLabels();

    // --- global ---
    await this._scanSkillDirs(path.join(home, '.claude', 'skills'), L.claudeGlobal, skills);
    await this._readSingle(path.join(home, '.claude', 'CLAUDE.md'), L.claudeGlobal, 'CLAUDE.md', skills);
    await this._scanDir(path.join(home, '.cursor', 'rules'), '.mdc', L.cursorGlobal, skills);
    await this._readSingle(path.join(home, '.cursorrules'), L.cursorGlobal, '.cursorrules', skills);
    this._readCopilotInstructions(L.copilotGlobal, skills);

    // --- project ---
    if (workspaceRoot) {
      await this._scanSkillDirs(path.join(workspaceRoot, '.claude', 'skills'), L.claudeProject, skills);
      await this._scanDir(path.join(workspaceRoot, '.cursor', 'rules'), '.mdc', L.cursorProject, skills);
      await this._readSingle(path.join(workspaceRoot, '.cursorrules'), L.cursorProject, '.cursorrules', skills);
      await this._readSingle(path.join(workspaceRoot, '.clinerules'), L.clineProject, '.clinerules', skills);
      await this._readSingle(path.join(workspaceRoot, '.windsurfrules'), L.windsurfProject, '.windsurfrules', skills);
      await this._readSingle(
        path.join(workspaceRoot, '.github', 'copilot-instructions.md'),
        L.copilotProject,
        'copilot-instructions.md',
        skills,
      );
    }

    this._skills = skills;
    return skills;
  }

  /** Read sub-directories of `dir`, each expected to contain a `SKILL.md`. */
  private async _scanSkillDirs(dir: string, agent: string, skills: SkillItem[]): Promise<void> {
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));
    } catch {
      return;
    }
    for (const [name, type] of entries) {
      // Use bitwise AND to also match symlinked directories (e.g. Claude Code skill symlinks).
      if (!(type & vscode.FileType.Directory)) {
        continue;
      }
      await this._readSingle(path.join(dir, name, 'SKILL.md'), agent, name, skills);
    }
  }

  /** Read flat files of a given extension inside `dir` (e.g. Cursor `.mdc`). */
  private async _scanDir(dir: string, ext: string, agent: string, skills: SkillItem[]): Promise<void> {
    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));
    } catch {
      return;
    }
    for (const [name, type] of entries) {
      // Use bitwise AND to also match symlinked files.
      if (!(type & vscode.FileType.File) || !name.endsWith(ext)) {
        continue;
      }
      await this._readSingle(path.join(dir, name), agent, name.slice(0, -ext.length), skills);
    }
  }

  /** Read a single fixed-path file and append it as a skill (silently ignored if missing). */
  private async _readSingle(filePath: string, agent: string, fallbackName: string, skills: SkillItem[]): Promise<void> {
    const content = await this._readFileText(filePath);
    if (content === undefined) {
      return;
    }
    const { name, description } = this._parseFrontmatter(content, fallbackName);
    skills.push({ name, description, path: filePath, agent, content });
  }

  /** Read Copilot instructions from the VS Code user setting (inline text, no file path). */
  private _readCopilotInstructions(agent: string, skills: SkillItem[]): void {
    const raw = vscode.workspace
      .getConfiguration('github.copilot.chat.codeGeneration')
      .get<string | string[]>('instructions');
    let text = '';
    if (typeof raw === 'string') {
      text = raw;
    } else if (Array.isArray(raw)) {
      text = raw.join('\n');
    }
    if (text.trim()) {
      const L = getSkillAgentLabels();
      skills.push({
        name: L.copilotInstructionsName,
        description: L.copilotInstructionsDesc,
        path: '',
        agent,
        content: text,
      });
    }
  }

  private async _readFileText(filePath: string): Promise<string | undefined> {
    try {
      const buf = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      return Buffer.from(buf).toString('utf8');
    } catch {
      return undefined;
    }
  }

  /** Extract `name` and `description` from YAML frontmatter; fall back to the file/dir name. */
  private _parseFrontmatter(content: string, fallbackName: string): { name: string; description: string } {
    let name = fallbackName;
    let description = '';
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (match) {
      const fm = match[1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      if (nameMatch) {
        name = nameMatch[1].trim();
      }
      const descMatch = fm.match(/^description:\s*(.+)$/m);
      if (descMatch) {
        description = descMatch[1].trim();
      }
    }
    return { name, description };
  }

  // ---------------------------------------------------------------- html

  private _getHtml(webview: vscode.Webview, isEditor: boolean): string {
    const nonce = getNonce();
    const lang = getLang();
    // Serialise webview messages as a JS object so the webview JS can
    // reference localised strings without calling back to the host.
    const msg = getWebviewMessages();
    const msgJson = JSON.stringify(msg);
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${this._getCss()}</style>
</head>
<body>
${this._getBody(isEditor)}
<div id="toast" class="toast hidden"></div>
<div id="history-popup" class="history-popup hidden"></div>
<script nonce="${nonce}">var MSG=${msgJson};${this._getJs()}</script>
</body>
</html>`;
  }

  private _getBody(isEditor: boolean): string {
    const toolbar = isEditor
      ? `<div class="toolbar editor-toolbar">
  <div class="editor-title">✍ write-ai-prompt-better <span class="editor-badge">${t('editorBadge')}</span></div>
  <div class="editor-actions">
    <button id="lang-switch-btn" class="lang-switch-btn" title="Switch language">${t('langSwitchTo')}</button>
    <button id="clear-btn" class="btn-danger">${t('clear')}</button>
    <button id="split-btn">${t('splitRight')}</button>
  </div>
</div>`
      : `<div class="toolbar">
  <button id="clear-btn" class="btn-danger">${t('clear')}</button>
  <div class="toolbar-actions">
    <button id="lang-switch-btn" class="lang-switch-btn" title="Switch language">${t('langSwitchTo')}</button>
    <button id="open-editor-btn">${t('openInWindow')}</button>
  </div>
</div>`;

    return `<div class="app">
${toolbar}
  <div class="main-content">
  <section class="section">
    <div class="section-title">${t('sectionBackground')}</div>
    <div id="context-list"></div>
    <div class="manual-wrap">
      <button id="manual-add-btn" class="link-btn">${t('addManual')}</button>
      <div id="manual-add-form" class="hidden">
        <textarea id="manual-input" placeholder="${t('manualPlaceholder')}"></textarea>
        <div class="manual-actions">
          <button id="manual-confirm" class="btn-primary">${t('addBtn')}</button>
          <button id="manual-cancel">${t('cancelBtn')}</button>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-title">${t('sectionSkills')}</div>
    <div class="skill-picker">
      <button id="skill-dropdown-btn">${t('addSkill')}</button>
      <div id="skill-dropdown" class="skill-dropdown hidden">
        <div class="skill-search"><input id="skill-search" type="text" placeholder="${t('searchSkill')}"></div>
        <div id="skill-list"></div>
      </div>
    </div>
    <div id="skill-chips" class="skill-chips"></div>
  </section>

  <section class="section">
    <div class="section-title">${t('sectionRequirement')}</div>
    <div class="preset-row">
      <button id="req-preset-btn">${t('selectPreset')}</button>
      <div id="req-preset-dropdown" class="preset-dropdown hidden"></div>
      <button id="req-preset-manage" class="gear-btn" title="${t('managePresets')}">⚙</button>
    </div>
    <div id="req-preset-panel" class="preset-panel hidden"></div>
    <textarea id="req-textarea" rows="6" placeholder="${t('requirementPlaceholder')}"></textarea>
  </section>

  <section class="section">
    <div class="section-title">${t('sectionValidation')}</div>
    <div class="preset-row">
      <button id="val-preset-btn">${t('selectPreset')}</button>
      <div id="val-preset-dropdown" class="preset-dropdown hidden"></div>
      <button id="val-preset-manage" class="gear-btn" title="${t('managePresets')}">⚙</button>
    </div>
    <div id="val-preset-panel" class="preset-panel hidden"></div>
    <textarea id="val-textarea" rows="3" placeholder="${t('validationPlaceholder')}"></textarea>
  </section>

  <div class="action-bar">
    <button id="preview-btn">${t('previewBtn')}</button>
    <button id="copy-btn" class="btn-primary">${t('copyBtn')}</button>
  </div>

  <div id="preview-wrap" class="preview-wrap hidden">
    <div class="preview-header">${t('promptPreviewTitle')} <button id="preview-close" class="close-btn">×</button></div>
    <pre id="preview-content"></pre>
  </div>

  </div>
  <section class="section history-section">
    <div id="history-header" class="section-title history-header">
      <span id="history-chevron" class="chevron">›</span>
      <span>${t('sectionHistory')}</span>
      <span id="history-badge" class="badge">0</span>
      <button id="history-clear" class="link-btn hidden">${t('clearHistory')}</button>
    </div>
    <div id="history-list" class="history-list hidden"></div>
  </section>
</div>`;
  }

  private _getCss(): string {
    return `*{box-sizing:border-box}
html,body{height:100%;margin:0;padding:0}
body{font-family:var(--vscode-font-family,sans-serif);font-size:var(--vscode-font-size,13px);color:var(--vscode-foreground,#333);background-color:var(--vscode-sideBar-background,transparent)}
.app{display:flex;flex-direction:column;gap:6px;padding:0;height:100%;overflow-y:auto}
.hidden{display:none !important}
.toolbar{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:8px 10px 0}
.editor-toolbar{padding-bottom:6px;border-bottom:1px solid var(--vscode-panel-border,rgba(128,128,128,.2))}
.main-content{display:flex;flex-direction:column;gap:10px;padding:0 10px 24px}
.editor-title{font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;overflow:hidden}
.editor-badge{font-size:10px;font-weight:400;padding:1px 6px;border-radius:8px;background:var(--vscode-badge-background,#4d4d4d);color:var(--vscode-badge-foreground,#fff)}
.toolbar-actions{display:flex;gap:6px;align-items:center}
.editor-actions{display:flex;gap:6px}
.lang-switch-btn{font-size:11px;padding:3px 8px;min-width:36px;text-align:center;font-weight:500}
button{font-family:inherit;font-size:12px;cursor:pointer;border:1px solid var(--vscode-button-border,transparent);border-radius:3px;padding:4px 10px;background:var(--vscode-button-secondaryBackground,#3a3d41);color:var(--vscode-button-secondaryForeground,#fff);white-space:nowrap}
button:hover{background:var(--vscode-button-secondaryHoverBackground,#45494e)}
.btn-danger{background:var(--vscode-errorForeground,#f48771);color:#fff;border-color:transparent}
.btn-danger:hover{opacity:.9;background:var(--vscode-errorForeground,#f48771)}
.btn-primary{background:var(--vscode-button-background,#0e639c);color:var(--vscode-button-foreground,#fff)}
.btn-primary:hover{background:var(--vscode-button-hoverBackground,#1177bb)}
.gear-btn{padding:2px 8px}
.link-btn{background:transparent;border:none;color:var(--vscode-textLink-foreground,#3794ff);padding:0 4px;font-size:11px}
.link-btn:hover{background:transparent;text-decoration:underline}
.section{display:flex;flex-direction:column;gap:6px}
.section-title{font-size:12px;font-weight:600;color:var(--vscode-foreground);display:flex;align-items:center;gap:6px}
.empty{color:var(--vscode-descriptionForeground,#888);font-size:11px;padding:8px 4px;text-align:center}
.ctx-card{border:1px solid var(--vscode-input-border,rgba(128,128,128,.3));border-radius:4px;background:var(--vscode-input-background,rgba(128,128,128,.1));margin-bottom:6px;overflow:hidden}
.ctx-card-head{display:flex;align-items:center;gap:4px;padding:4px 6px}
.ctx-icon{font-size:12px}
.ctx-title{flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--vscode-editor-font-family,monospace)}
.ctx-actions{display:flex;gap:2px}
.ctx-toggle,.ctx-remove{padding:0 5px;font-size:12px;background:transparent;border:none;color:var(--vscode-foreground);line-height:16px}
.ctx-toggle:hover,.ctx-remove:hover{background:var(--vscode-list-hoverBackground,rgba(128,128,128,.2))}
.ctx-toggle.rotated{transform:rotate(180deg);display:inline-block}
.card-content{margin:0;padding:6px 8px;border-top:1px solid var(--vscode-input-border,rgba(128,128,128,.2));font-family:var(--vscode-editor-font-family,monospace);font-size:11px;color:var(--vscode-descriptionForeground,#aaa);white-space:pre-wrap;word-break:break-word;max-height:90px;overflow:auto}
.manual-content{font-family:var(--vscode-font-family,sans-serif)}
.ctx-card.collapsed .card-content{display:none}
.ctx-edit-form{padding:6px 8px;border-top:1px solid var(--vscode-input-border,rgba(128,128,128,.2));display:flex;flex-direction:column;gap:4px}
.ctx-edit-textarea{width:100%;min-height:60px;resize:vertical;padding:4px 6px;font-family:var(--vscode-editor-font-family,monospace);font-size:11px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:3px}
.ctx-edit-input{width:100%;padding:4px 6px;font-family:var(--vscode-editor-font-family,monospace);font-size:11px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:3px}
.ctx-edit-actions{display:flex;gap:4px}
.manual-wrap{display:flex;flex-direction:column;gap:6px}
.manual-actions{display:flex;gap:6px}
#manual-input{width:100%;min-height:50px;resize:vertical;padding:6px;font-family:inherit;font-size:12px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:3px}
.skill-picker{position:relative}
.skill-dropdown{position:absolute;top:100%;left:0;right:0;z-index:50;max-height:360px;display:flex;flex-direction:column;background:var(--vscode-dropdown-background,#252526);border:1px solid var(--vscode-dropdown-border,var(--vscode-input-border));border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.skill-search{position:sticky;top:0;padding:6px;background:var(--vscode-dropdown-background,#252526);border-bottom:1px solid var(--vscode-input-border,rgba(128,128,128,.3));z-index:1}
#skill-search{width:100%;padding:4px 6px;font-size:12px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:3px}
#skill-list{overflow-y:auto;max-height:300px}
.skill-group-title{padding:4px 8px;font-size:10px;font-weight:600;color:var(--vscode-descriptionForeground,#888);background:var(--vscode-list-hoverBackground,rgba(128,128,128,.08))}
.skill-item{display:flex;align-items:center;gap:6px;padding:6px 8px;cursor:pointer}
.skill-item:hover{background:var(--vscode-list-hoverBackground,rgba(128,128,128,.15))}
.skill-item-main{flex:1;min-width:0}
.skill-item-name{font-size:12px}
.skill-item-desc{font-size:10px;color:var(--vscode-descriptionForeground,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.skill-item-open{padding:2px 6px;font-size:12px;background:transparent;border:none;opacity:.7}
.skill-item-open:hover{opacity:1;background:var(--vscode-list-hoverBackground)}
.skill-chips{display:flex;flex-wrap:wrap;gap:4px}
.skill-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:10px;font-size:11px;background:var(--vscode-button-secondaryBackground,#3a3d41);color:var(--vscode-button-secondaryForeground,#fff)}
.chip-agent{font-size:9px;opacity:.8}
.chip-name{font-weight:500}
.chip-open,.chip-remove{padding:0 4px;background:transparent;border:none;color:inherit;font-size:11px;line-height:14px}
.chip-remove:hover{color:var(--vscode-errorForeground,#f48771)}
.preset-row{display:flex;align-items:center;gap:6px;position:relative}
.preset-dropdown{position:absolute;top:100%;left:0;z-index:40;min-width:100%;max-height:240px;overflow-y:auto;background:var(--vscode-dropdown-background,#252526);border:1px solid var(--vscode-dropdown-border,var(--vscode-input-border));border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.preset-item{padding:5px 8px;font-size:12px;cursor:pointer}
.preset-item:hover{background:var(--vscode-list-hoverBackground,rgba(128,128,128,.15))}
.preset-panel{border:1px solid var(--vscode-input-border,rgba(128,128,128,.3));border-radius:4px;padding:6px;display:flex;flex-direction:column;gap:4px}
.preset-row-item{border-bottom:1px solid var(--vscode-input-border,rgba(128,128,128,.15));padding:4px 0}
.preset-row-item:last-of-type{border-bottom:none}
.preset-row-display{display:flex;align-items:center;gap:6px}
.preset-row-label{flex:1;font-size:12px}
.preset-edit-form{display:flex;flex-direction:column;gap:4px}
.preset-edit-form input,.preset-add-form input{width:100%;padding:3px 6px;font-size:12px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:3px}
.preset-add-form{display:flex;flex-direction:column;gap:4px;margin-top:4px;padding-top:6px;border-top:1px solid var(--vscode-input-border,rgba(128,128,128,.2))}
textarea{width:100%;font-family:var(--vscode-font-family,sans-serif);font-size:var(--vscode-font-size,13px);background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:3px;padding:6px;resize:vertical;outline:none}
textarea:focus{border-color:var(--vscode-focusBorder,#007fd4)}
#req-textarea{min-height:110px}
#val-textarea{min-height:56px}
.action-bar{display:flex;gap:6px;justify-content:flex-end;padding-top:4px}
.preview-wrap{border:1px solid var(--vscode-input-border,rgba(128,128,128,.3));border-radius:4px;overflow:hidden;display:flex;flex-direction:column;max-height:300px}
.preview-header{display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid var(--vscode-input-border,rgba(128,128,128,.2));font-size:12px;font-weight:600;flex-shrink:0}
#preview-content{margin:0;padding:8px;font-family:var(--vscode-editor-font-family,monospace);font-size:11px;white-space:pre-wrap;word-break:break-word;flex:1;overflow:auto;min-height:0;color:var(--vscode-descriptionForeground,#aaa)}
.close-btn{padding:0 6px;background:transparent;border:none;color:var(--vscode-foreground)}
.history-section{padding:0 10px 12px}
.history-header{cursor:pointer;user-select:none;padding:6px 4px;border-top:1px solid var(--vscode-input-border,rgba(128,128,128,.2))}
.chevron{display:inline-block;transition:transform .15s ease;font-size:12px}
.chevron.rotated{transform:rotate(90deg)}
.badge{margin-left:auto;background:var(--vscode-badge-background,#4d4d4d);color:var(--vscode-badge-foreground,#fff);border-radius:10px;padding:0 8px;font-size:10px;font-weight:600}
.history-list{display:flex;flex-direction:column;gap:6px;padding-top:6px}
.history-item{border:1px solid var(--vscode-input-border,rgba(128,128,128,.3));border-radius:4px;padding:6px 8px}
.history-preview{font-size:11px;color:var(--vscode-descriptionForeground,#aaa);white-space:pre-wrap;word-break:break-word;max-height:40px;overflow:hidden}
.history-meta{display:flex;justify-content:space-between;align-items:center;margin-top:4px;font-size:11px}
.history-time{color:var(--vscode-descriptionForeground,#888)}
.history-item-actions{display:flex;gap:4px;align-items:center}
.history-restore{padding:2px 8px;font-size:11px}
.history-preview-btn,.history-delete{padding:0 5px;background:transparent;border:none;font-size:12px;color:var(--vscode-foreground)}
.history-delete:hover{color:var(--vscode-errorForeground,#f48771)}
.history-popup{position:fixed;z-index:100;background:var(--vscode-editor-background,#1e1e1e);border:1px solid var(--vscode-input-border,rgba(128,128,128,.5));border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,.4);max-width:420px;max-height:300px;overflow:hidden;display:flex;flex-direction:column}
.popup-header{display:flex;justify-content:space-between;align-items:center;padding:4px 8px;font-size:12px;font-weight:600;border-bottom:1px solid var(--vscode-input-border,rgba(128,128,128,.2))}
.popup-copy{padding:2px 8px;font-size:11px}
.popup-content{margin:0;padding:8px;font-family:var(--vscode-editor-font-family,monospace);font-size:11px;white-space:pre-wrap;word-break:break-word;overflow:auto;max-height:250px;color:var(--vscode-descriptionForeground,#aaa)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--vscode-notificationToast-background,#252526);color:var(--vscode-notificationToast-foreground,#fff);border:1px solid var(--vscode-input-border,rgba(128,128,128,.4));padding:6px 14px;border-radius:4px;font-size:12px;z-index:200;box-shadow:0 2px 8px rgba(0,0,0,.4)}`;
  }

  private _getJs(): string {
    // NOTE: This string is embedded in a TS template literal. The webview JS
    // below intentionally avoids backticks, ${} and backslash escapes so it
    // survives interpolation unchanged. Newlines use NL, backticks use BT.
    // Localised strings are accessed via the MSG object injected before this script.
    return `(function(){
var vscode = acquireVsCodeApi();
var NL = String.fromCharCode(10);
var BT = String.fromCharCode(96);
var FENCE = BT + BT + BT;

var state = { contextItems: [], presets: [], validationPresets: [], history: [], skills: [], selectedSkills: [] };
var editingWhich = null;
var editingIndex = -1;
var ctxEditingId = null;
var previewOpen = false;
var historyOpen = false;
var toastTimer = null;

function $(id){ return document.getElementById(id); }
function hasClass(el, cls){ return el && el.classList && el.classList.contains(cls); }
function post(msg){ vscode.postMessage(msg); }
function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

function escapeHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function showToast(msg){
  var t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.add('hidden'); }, 2200);
}
function fmt(s){ var a=arguments; return s.replace(/\\{(\\d+)\\}/g, function(_,i){ return a[+i+1] || ''; }); }
function relativeTime(ts){
  var diff = Date.now() - ts;
  var m = Math.floor(diff / 60000);
  if (m < 1) return MSG.timeJustNow;
  if (m < 60) return fmt(MSG.timeMinutesAgo, m);
  var h = Math.floor(m / 60);
  if (h < 24) return fmt(MSG.timeHoursAgo, h);
  return fmt(MSG.timeDaysAgo, Math.floor(h / 24));
}

function buildPrompt(){
  var parts = [];
  if (state.selectedSkills.length > 0){
    var lines = [];
    for (var i=0;i<state.selectedSkills.length;i++){
      var s = state.selectedSkills[i];
      if (s.path) lines.push('- ' + BT + s.path + BT);
    }
    if (lines.length > 0) parts.push(MSG.promptSkillHeader + NL + NL + lines.join(NL));
  }
  if (state.contextItems.length > 0){
    var body = [MSG.promptBackgroundIntro];
    for (var j=0;j<state.contextItems.length;j++){
      var item = state.contextItems[j];
      if (item.type === 'file'){
        var ref = '📄 ' + BT + item.filePath + BT;
        if (item.lineRange) ref += '#' + item.lineRange;
        body.push(ref);
      } else if (item.type === 'folder'){
        body.push('📁 ' + BT + item.filePath + BT);
      } else if (item.type === 'fileRef'){
        body.push('📄 ' + BT + item.filePath + BT);
      } else if (item.type === 'terminal'){
        body.push('');
        body.push('💻 Terminal output:');
        body.push(FENCE);
        body.push(item.content);
        body.push(FENCE);
      } else if (item.type === 'manual'){
        body.push('');
        body.push('📝 ' + item.content);
      }
    }
    parts.push(MSG.promptBackgroundHeader + NL + NL + body.join(NL));
  }
  var req = $('req-textarea').value.trim();
  if (req) parts.push(MSG.promptRequirementHeader + NL + NL + req);
  var val = $('val-textarea').value.trim();
  if (val) parts.push(MSG.promptValidationHeader + NL + NL + val);
  return parts.join(NL + NL);
}

function makePreview(prompt){
  var lines = prompt.split(NL);
  var kept = [];
  for (var i=0;i<lines.length;i++){
    var l = lines[i];
    if (l.charAt(0) === '#') continue;
    var t = l.trim();
    if (t) kept.push(t);
  }
  return kept.join(' ').slice(0, 100);
}

function parseSection(prompt, marker){
  var idx = prompt.indexOf(marker);
  if (idx < 0) return '';
  var rest = prompt.slice(idx + marker.length);
  var nextIdx = rest.indexOf(NL + '## ');
  var section = nextIdx < 0 ? rest : rest.slice(0, nextIdx);
  return section.trim();
}

function renderContextList(){
  var box = $('context-list');
  if (state.contextItems.length === 0){
    box.innerHTML = '<div class="empty">' + escapeHtml(MSG.ctxEmptyHint) + '</div>';
    return;
  }
  var html = '';
  for (var i=0;i<state.contextItems.length;i++){
    var item = state.contextItems[i];
    var icon='', title='', contentHtml='', hasContent=false;
    if (item.type === 'file'){
      icon='📄'; title=item.filePath + (item.lineRange ? '#'+item.lineRange : '');
      if (item.content){ hasContent=true; contentHtml='<pre class="card-content">'+escapeHtml(item.content)+'</pre>'; }
    } else if (item.type === 'folder'){ icon='📁'; title=item.filePath; }
    else if (item.type === 'fileRef'){ icon='📄'; title=item.filePath; }
    else if (item.type === 'terminal'){
      icon='💻'; title=MSG.terminalOutput;
      if (item.content){ hasContent=true; contentHtml='<pre class="card-content">'+escapeHtml(item.content)+'</pre>'; }
    } else if (item.type === 'manual'){
      icon='📝'; title=MSG.manualNote;
      if (item.content){ hasContent=true; contentHtml='<div class="card-content manual-content">'+escapeHtml(item.content)+'</div>'; }
    }
    var toggleBtn = hasContent ? '<button class="ctx-toggle" title="' + MSG.toggleExpand + '">▼</button>' : '';
    var isEditing = (ctxEditingId === item.id);
    var editContent = '';
    if (isEditing && item.type === 'manual'){
      editContent = '<div class="ctx-edit-form">'+
        '<textarea class="ctx-edit-textarea" rows="4">'+escapeHtml(item.content)+'</textarea>'+
        '<div class="ctx-edit-actions">'+
        '<button class="ctx-edit-save btn-primary">' + MSG.saveBtn + '</button>'+
        '<button class="ctx-edit-cancel">' + MSG.cancelBtn + '</button></div></div>';
    }
    var editBtn = (item.type === 'manual' ? '<button class="ctx-edit" title="' + MSG.editBtn + '">✏</button>' : '');
    html += '<div class="ctx-card' + (isEditing ? '' : ' collapsed') + '" data-id="'+escapeHtml(item.id)+'">'+
      '<div class="ctx-card-head">'+
        '<span class="ctx-icon">'+icon+'</span>'+
        '<span class="ctx-title" title="'+escapeHtml(title)+'">'+escapeHtml(title)+'</span>'+
        '<span class="ctx-actions">'+toggleBtn+editBtn+'<button class="ctx-remove" title="' + MSG.removeBtn + '">×</button></span>'+
      '</div>'+ (isEditing ? editContent : contentHtml) +'</div>';
  }
  box.innerHTML = html;
}

function renderSelectedSkills(){
  var box = $('skill-chips');
  if (state.selectedSkills.length === 0){ box.innerHTML=''; return; }
  var html='';
  for (var i=0;i<state.selectedSkills.length;i++){
    var s = state.selectedSkills[i];
    var openBtn = s.path ? '<button class="chip-open" data-i="'+i+'" title="' + MSG.openFile + '">📂</button>' : '';
    html += '<div class="skill-chip" data-i="'+i+'">'+
      '<span class="chip-agent">'+escapeHtml(s.agent)+'</span>'+
      '<span class="chip-name">'+escapeHtml(s.name)+'</span>'+
      openBtn+'<button class="chip-remove" data-i="'+i+'" title="' + MSG.removeBtn + '">×</button></div>';
  }
  box.innerHTML = html;
}

function fuzzyMatch(text, query){
  if (!query) return true;
  var qi = 0;
  for (var i=0;i<text.length && qi<query.length;i++){
    if (text.charAt(i) === query.charAt(qi)) qi++;
  }
  return qi === query.length;
}

function renderSkillDropdown(){
  var list = $('skill-list');
  var q = ($('skill-search').value || '').toLowerCase();
  var groups = {}; var order = [];
  for (var i=0;i<state.skills.length;i++){
    var s = state.skills[i];
    if (q && !fuzzyMatch(s.name.toLowerCase(), q)) continue;
    if (!groups[s.agent]){ groups[s.agent]=[]; order.push(s.agent); }
    groups[s.agent].push(s);
  }
  var html='';
  for (var g=0;g<order.length;g++){
    var agent = order[g];
    html += '<div class="skill-group-title">'+escapeHtml(agent)+'</div>';
    var arr = groups[agent];
    for (var k=0;k<arr.length;k++){
      var sk = arr[k];
      var openBtn = sk.path ? '<button class="skill-item-open" data-path="'+escapeHtml(sk.path)+'" title="' + MSG.openFile + '">📂</button>' : '';
      html += '<div class="skill-item" data-name="'+escapeHtml(sk.name)+'" data-agent="'+escapeHtml(sk.agent)+'" data-path="'+escapeHtml(sk.path)+'" data-desc="'+escapeHtml(sk.description || '')+'">'+
        '<div class="skill-item-main"><div class="skill-item-name">'+escapeHtml(sk.name)+'</div>'+
        '<div class="skill-item-desc">'+escapeHtml(sk.description || '')+'</div></div>'+openBtn+'</div>';
    }
  }
  if (!html) html = '<div class="empty">' + escapeHtml(MSG.noMatchingSkill) + '</div>';
  list.innerHTML = html;
}

function getPresets(which){ return which === 'req' ? state.presets : state.validationPresets; }

function renderPresetDropdown(which){
  var dropdown = which === 'req' ? $('req-preset-dropdown') : $('val-preset-dropdown');
  var presets = getPresets(which);
  if (presets.length === 0){ dropdown.innerHTML='<div class="empty">' + escapeHtml(MSG.noPresets) + '</div>'; return; }
  var html='';
  for (var i=0;i<presets.length;i++){
    html += '<div class="preset-item" data-i="'+i+'">'+escapeHtml(presets[i].label)+'</div>';
  }
  dropdown.innerHTML = html;
}

function renderPresetPanel(which){
  var panel = which === 'req' ? $('req-preset-panel') : $('val-preset-panel');
  var presets = getPresets(which);
  var html='';
  for (var i=0;i<presets.length;i++){
    var p = presets[i];
    var editing = (which === editingWhich && i === editingIndex);
    if (editing){
      html += '<div class="preset-row-item"><div class="preset-edit-form">'+
        '<input class="pe-label" value="'+escapeHtml(p.label)+'" placeholder="' + MSG.nameLabel + '">'+
        '<input class="pe-value" value="'+escapeHtml(p.value)+'" placeholder="' + MSG.contentLabel + '">'+
        '<div class="manual-actions"><button class="pe-save btn-primary" data-i="'+i+'">' + MSG.saveBtn + '</button>'+
        '<button class="pe-cancel" data-i="'+i+'">' + MSG.cancelBtn + '</button></div></div></div>';
    } else {
      html += '<div class="preset-row-item"><div class="preset-row-display">'+
        '<span class="preset-row-label">'+escapeHtml(p.label)+'</span>'+
        '<button class="pe-edit" data-i="'+i+'" title="' + MSG.editBtn + '">✏</button>'+
        '<button class="pe-delete" data-i="'+i+'" title="' + MSG.deleteBtn + '">×</button></div></div>';
    }
  }
  html += '<div class="preset-add-form">'+
    '<input class="pa-label" placeholder="' + MSG.nameLabel + '">'+
    '<input class="pa-value" placeholder="' + MSG.contentLabel + '">'+
    '<button class="pa-add btn-primary">' + MSG.addPreset + '</button></div>';
  panel.innerHTML = html;
}

function savePresets(which){
  if (which === 'req') post({ type:'savePresets', presets: state.presets });
  else post({ type:'saveValidationPresets', presets: state.validationPresets });
}

function renderHistory(){
  var list = $('history-list');
  $('history-badge').textContent = String(state.history.length);
  var clearBtn = $('history-clear');
  if (state.history.length === 0){
    list.innerHTML = '<div class="empty">' + escapeHtml(MSG.noHistory) + '</div>';
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }
  if (clearBtn) clearBtn.classList.remove('hidden');
  var html='';
  for (var i=0;i<state.history.length;i++){
    var h = state.history[i];
    html += '<div class="history-item" data-i="'+i+'">'+
      '<div class="history-preview">'+escapeHtml(h.preview)+'</div>'+
      '<div class="history-meta">'+
        '<span class="history-time">'+relativeTime(h.timestamp)+'</span>'+
        '<span class="history-item-actions">'+
          '<button class="history-preview-btn" data-i="'+i+'" title="' + MSG.historyPreview + '">👁</button>'+
          '<button class="history-restore" data-i="'+i+'">' + MSG.historyRestore + '</button>'+
          '<button class="history-delete" data-i="'+i+'" title="' + MSG.historyDelete + '">×</button>'+
        '</span></div></div>';
  }
  list.innerHTML = html;
}

function openPreview(){ previewOpen=true; $('preview-wrap').classList.remove('hidden'); $('preview-btn').textContent=MSG.closePreview; refreshPreview(); setTimeout(function(){ $('preview-wrap').scrollIntoView({behavior:'smooth',block:'nearest'}); }, 60); }
function closePreview(){ previewOpen=false; $('preview-wrap').classList.add('hidden'); $('preview-btn').textContent=MSG.previewBtn; }
function refreshPreview(){ if (!previewOpen) return; var p = buildPrompt(); $('preview-content').textContent = p || MSG.emptyPrompt; }

function clearAll(){
  state.contextItems=[]; state.selectedSkills=[];
  ctxEditingId=null;
  $('req-textarea').value=''; $('val-textarea').value='';
  closePreview(); renderContextList(); renderSelectedSkills();
  post({ type:'clearContextItems' });
}

function onCopy(){
  var prompt = buildPrompt();
  post({ type:'copyToClipboard', text: prompt });
  var snapshot = state.contextItems.map(function(x){
    return { id:x.id, type:x.type, content:x.content, filePath:x.filePath, lineRange:x.lineRange, timestamp:x.timestamp };
  });
  post({ type:'saveHistory', item: { id: genId(), prompt: prompt, preview: makePreview(prompt), timestamp: Date.now(), contextItems: snapshot } });
  showToast(MSG.toastCopied);
}

function addSkill(name, agent, fp, desc){
  for (var i=0;i<state.selectedSkills.length;i++){
    if (state.selectedSkills[i].name === name && state.selectedSkills[i].agent === agent){ showToast(MSG.toastSkillSelected); return; }
  }
  state.selectedSkills.push({ name:name, agent:agent, path:fp, description:desc, content:'' });
  renderSelectedSkills(); refreshPreview();
}
function removeSkill(i){ state.selectedSkills.splice(i,1); renderSelectedSkills(); refreshPreview(); }

function appendPreset(which, i){
  var value = getPresets(which)[i].value;
  var ta = which === 'req' ? $('req-textarea') : $('val-textarea');
  ta.value = ta.value ? ta.value + NL + value : value;
  refreshPreview();
}

function restoreFromHistory(i){
  var h = state.history[i];
  state.contextItems = (h.contextItems || []).map(function(x){
    return { id:x.id, type:x.type, content:x.content, filePath:x.filePath, lineRange:x.lineRange, timestamp:x.timestamp };
  });
  state.selectedSkills = [];
  renderContextList(); renderSelectedSkills();
  var req = parseSection(h.prompt, MSG.promptRequirementHeader);
  if (!req) req = parseSection(h.prompt, MSG.promptRequirementHeaderAlt);
  $('req-textarea').value = req;
  var val = parseSection(h.prompt, MSG.promptValidationHeader);
  if (!val) val = parseSection(h.prompt, MSG.promptValidationHeaderAlt);
  $('val-textarea').value = val;
  post({ type:'setContextItems', items: state.contextItems });
  toggleHistory(false);
  refreshPreview();
  showToast(MSG.toastRestored);
}

function toggleHistory(open){
  historyOpen = (typeof open === 'boolean') ? open : !historyOpen;
  var header = $('history-header');
  var list = $('history-list');
  var chevron = $('history-chevron');
  if (historyOpen){ list.classList.remove('hidden'); header.classList.add('expanded'); chevron.classList.add('rotated'); }
  else { list.classList.add('hidden'); header.classList.remove('expanded'); chevron.classList.remove('rotated'); }
}

function showHistoryPopup(i, anchor){
  var h = state.history[i];
  var popup = $('history-popup');
  popup.innerHTML = '<div class="popup-header">' + escapeHtml(MSG.fullPromptTitle) + ' <button class="popup-copy" data-i="'+i+'">' + MSG.historyCopyBtn + '</button></div>'+
    '<pre class="popup-content">'+escapeHtml(h.prompt)+'</pre>';
  popup.classList.remove('hidden');
  var rect = anchor.getBoundingClientRect();
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.left = '8px';
}
function hideHistoryPopup(){ $('history-popup').classList.add('hidden'); }

function bindPresetSection(which){
  var btn = $(which === 'req' ? 'req-preset-btn' : 'val-preset-btn');
  var dropdown = $(which === 'req' ? 'req-preset-dropdown' : 'val-preset-dropdown');
  var manageBtn = $(which === 'req' ? 'req-preset-manage' : 'val-preset-manage');
  var panel = $(which === 'req' ? 'req-preset-panel' : 'val-preset-panel');

  btn.addEventListener('click', function(e){
    e.stopPropagation();
    if (!dropdown.classList.contains('hidden')){ dropdown.classList.add('hidden'); }
    else { renderPresetDropdown(which); dropdown.classList.remove('hidden'); }
  });
  dropdown.addEventListener('click', function(e){
    e.stopPropagation();
    var t = e.target;
    if (hasClass(t, 'preset-item')){ appendPreset(which, +t.getAttribute('data-i')); dropdown.classList.add('hidden'); }
  });
  document.addEventListener('click', function(){ dropdown.classList.add('hidden'); });

  manageBtn.addEventListener('click', function(e){
    e.stopPropagation();
    if (!panel.classList.contains('hidden')){ panel.classList.add('hidden'); }
    else { editingWhich=null; editingIndex=-1; renderPresetPanel(which); panel.classList.remove('hidden'); }
  });
  panel.addEventListener('click', function(e){
    e.stopPropagation();
    var t = e.target;
    var presets = getPresets(which);
    if (hasClass(t, 'pe-edit')){ editingWhich=which; editingIndex=+t.getAttribute('data-i'); renderPresetPanel(which); return; }
    if (hasClass(t, 'pe-cancel')){ editingWhich=null; editingIndex=-1; renderPresetPanel(which); return; }
    if (hasClass(t, 'pe-save')){
      var i = +t.getAttribute('data-i');
      var row = t.closest('.preset-row-item');
      var label = row.querySelector('.pe-label').value.trim();
      var value = row.querySelector('.pe-value').value;
      if (!label){ showToast(MSG.enterName); return; }
      presets[i] = { label:label, value:value };
      editingWhich=null; editingIndex=-1; savePresets(which); renderPresetPanel(which); renderPresetDropdown(which); return;
    }
    if (hasClass(t, 'pe-delete')){ presets.splice(+t.getAttribute('data-i'),1); savePresets(which); renderPresetPanel(which); renderPresetDropdown(which); return; }
    if (hasClass(t, 'pa-add')){
      var alabel = panel.querySelector('.pa-label').value.trim();
      var avalue = panel.querySelector('.pa-value').value;
      if (!alabel){ showToast(MSG.enterName); return; }
      presets.push({ label:alabel, value:avalue });
      savePresets(which); renderPresetPanel(which); renderPresetDropdown(which); return;
    }
  });
}

function init(){
  var clearBtn = $('clear-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearAll);
  var openEditorBtn = $('open-editor-btn');
  if (openEditorBtn) openEditorBtn.addEventListener('click', function(){ post({ type:'openEditorPanel' }); });
  var splitBtn = $('split-btn');
  if (splitBtn) splitBtn.addEventListener('click', function(){ post({ type:'openEditorPanelBeside' }); });
  var langBtn = $('lang-switch-btn');
  if (langBtn) langBtn.addEventListener('click', function(){
    var cur = document.documentElement.lang || 'en';
    var next = (cur === 'zh-cn' || cur === 'zh-CN') ? 'en' : 'zh-cn';
    post({ type:'changeLanguage', lang: next });
  });

  var manualBtn = $('manual-add-btn');
  var manualForm = $('manual-add-form');
  var manualInput = $('manual-input');
  manualBtn.addEventListener('click', function(){
    manualForm.classList.toggle('hidden');
    if (!manualForm.classList.contains('hidden')) manualInput.focus();
  });
  $('manual-confirm').addEventListener('click', function(){
    var v = manualInput.value;
    if (v && v.trim()){ post({ type:'addManualItem', content: v }); manualInput.value=''; manualForm.classList.add('hidden'); }
  });
  $('manual-cancel').addEventListener('click', function(){ manualInput.value=''; manualForm.classList.add('hidden'); });
  manualInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); $('manual-confirm').click(); }
    else if (e.key === 'Escape'){ manualInput.value=''; manualForm.classList.add('hidden'); }
  });

  $('context-list').addEventListener('click', function(e){
    var t = e.target;
    var card = t.closest('.ctx-card');
    if (!card) return;
    var id = card.getAttribute('data-id');
    if (hasClass(t, 'ctx-remove')){ post({ type:'removeContextItem', id: id }); return; }
    if (hasClass(t, 'ctx-toggle')){ card.classList.toggle('collapsed'); t.classList.toggle('rotated'); return; }
    if (hasClass(t, 'ctx-edit')){ ctxEditingId=id; renderContextList(); return; }
    if (hasClass(t, 'ctx-edit-cancel')){ ctxEditingId=null; renderContextList(); return; }
    if (hasClass(t, 'ctx-edit-save')){
      var textarea = t.closest('.ctx-edit-form').querySelector('.ctx-edit-textarea');
      for (var j=0;j<state.contextItems.length;j++){
        if (state.contextItems[j].id === id){ state.contextItems[j].content = textarea.value; break; }
      }
      ctxEditingId=null;
      post({ type:'setContextItems', items: state.contextItems });
      return;
    }
  });
  $('context-list').addEventListener('keydown', function(e){
    if (!ctxEditingId) return;
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName === 'TEXTAREA'){
      e.preventDefault();
      var card = e.target.closest('.ctx-card');
      if (card){ card.querySelector('.ctx-edit-save').click(); }
    } else if (e.key === 'Escape'){
      ctxEditingId=null; renderContextList();
    }
  });

  var skillBtn = $('skill-dropdown-btn');
  var skillDropdown = $('skill-dropdown');
  var skillSearch = $('skill-search');
  function closeSkillDropdown(){ skillDropdown.classList.add('hidden'); skillSearch.value=''; }
  skillBtn.addEventListener('click', function(e){
    e.stopPropagation();
    if (!skillDropdown.classList.contains('hidden')){ closeSkillDropdown(); return; }
    skillDropdown.classList.remove('hidden');
    skillSearch.value=''; post({ type:'getSkills' }); renderSkillDropdown(); skillSearch.focus();
  });
  skillSearch.addEventListener('input', renderSkillDropdown);
  skillSearch.addEventListener('click', function(e){ e.stopPropagation(); });
  skillDropdown.addEventListener('click', function(e){
    e.stopPropagation();
    var t = e.target;
    if (hasClass(t, 'skill-item-open')){ post({ type:'openSkillFile', path: t.getAttribute('data-path') }); return; }
    var item = t.closest('.skill-item');
    if (item){ addSkill(item.getAttribute('data-name'), item.getAttribute('data-agent'), item.getAttribute('data-path'), item.getAttribute('data-desc')); closeSkillDropdown(); }
  });
  document.addEventListener('click', function(){ closeSkillDropdown(); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !skillDropdown.classList.contains('hidden')){ closeSkillDropdown(); }
  });

  $('skill-chips').addEventListener('click', function(e){
    var t = e.target;
    if (hasClass(t, 'chip-open')){ post({ type:'openSkillFile', path: state.selectedSkills[+t.getAttribute('data-i')].path }); return; }
    if (hasClass(t, 'chip-remove')){ removeSkill(+t.getAttribute('data-i')); return; }
  });

  bindPresetSection('req');
  bindPresetSection('val');

  $('req-textarea').addEventListener('input', refreshPreview);
  $('val-textarea').addEventListener('input', refreshPreview);

  $('preview-btn').addEventListener('click', function(){ if (previewOpen) closePreview(); else openPreview(); });
  $('preview-close').addEventListener('click', closePreview);
  $('copy-btn').addEventListener('click', onCopy);

  $('history-header').addEventListener('click', function(e){
    if (hasClass(e.target, 'history-clear')) return;
    toggleHistory();
  });
  var hc = $('history-clear');
  if (hc) hc.addEventListener('click', function(e){ e.stopPropagation(); post({ type:'clearHistory' }); });
  $('history-list').addEventListener('click', function(e){
    var t = e.target;
    if (hasClass(t, 'history-restore')){ restoreFromHistory(+t.getAttribute('data-i')); return; }
    if (hasClass(t, 'history-delete')){ post({ type:'deleteHistoryItem', id: state.history[+t.getAttribute('data-i')].id }); return; }
    if (hasClass(t, 'history-preview-btn')){ showHistoryPopup(+t.getAttribute('data-i'), t); return; }
  });
  var popup = $('history-popup');
  popup.addEventListener('mouseleave', hideHistoryPopup);
  popup.addEventListener('click', function(e){
    e.stopPropagation();
    var t = e.target;
    if (hasClass(t, 'popup-copy')){ post({ type:'copyToClipboard', text: state.history[+t.getAttribute('data-i')].prompt }); showToast(MSG.toastCopiedShort); }
  });

  window.addEventListener('message', function(event){
    var msg = event.data;
    switch (msg.type){
      case 'syncContextItems':
        ctxEditingId=null; state.contextItems = msg.items || []; renderContextList(); refreshPreview(); break;
      case 'historyData':
        state.history = msg.history || []; renderHistory(); break;
      case 'presetsData':
        state.presets = msg.presets || []; renderPresetDropdown('req');
        if (!$('req-preset-panel').classList.contains('hidden')) renderPresetPanel('req'); break;
      case 'validationPresetsData':
        state.validationPresets = msg.presets || []; renderPresetDropdown('val');
        if (!$('val-preset-panel').classList.contains('hidden')) renderPresetPanel('val'); break;
      case 'skillsData':
        state.skills = msg.skills || []; renderSkillDropdown(); break;
      case 'clearAll':
        ctxEditingId=null; state.contextItems=[]; state.selectedSkills=[];
        $('req-textarea').value=''; $('val-textarea').value='';
        closePreview(); renderContextList(); renderSelectedSkills(); break;
    }
  });

  post({ type:'ready' });
}

init();
})();`;
  }

  public dispose(): void {
    this._disposables.forEach((d) => d.dispose());
    this._disposables.length = 0;
  }
}
