/**
 * Internationalisation module for the write-ai-prompt-better extension.
 *
 * Provides translation helpers for both the Extension Host (TypeScript) and
 * the embedded Webview UI (JavaScript). The active language is determined by
 * VS Code's display language (`vscode.env.language`); English is the default.
 */

import * as vscode from 'vscode';

/** All message keys whose value is a plain string (no placeholders). */
export interface I18nMessages {
  // ── extension host error messages ──
  errorReadFile: string;
  errorReadPath: string;
  errorOpenSkill: string;

  // ── webview: toolbar ──
  editorBadge: string;
  clear: string;
  splitRight: string;
  openInWindow: string;
  /** Label on the language-switch button (shows the target language). */
  langSwitchTo: string;

  // ── webview: sections ──
  sectionBackground: string;
  sectionSkills: string;
  sectionRequirement: string;
  sectionValidation: string;
  sectionHistory: string;

  // ── webview: context / manual ──
  addManual: string;
  manualPlaceholder: string;
  addBtn: string;
  cancelBtn: string;
  ctxEmptyHint: string;
  toggleExpand: string;
  removeBtn: string;
  terminalOutput: string;
  manualNote: string;

  // ── webview: skill picker ──
  addSkill: string;
  searchSkill: string;
  noMatchingSkill: string;
  openFile: string;

  // ── webview: presets ──
  selectPreset: string;
  managePresets: string;
  noPresets: string;
  nameLabel: string;
  contentLabel: string;
  saveBtn: string;
  editBtn: string;
  deleteBtn: string;
  addPreset: string;
  enterName: string;

  // ── webview: requirements / validation ──
  requirementPlaceholder: string;
  validationPlaceholder: string;

  // ── webview: actions ──
  previewBtn: string;
  copyBtn: string;
  closePreview: string;
  promptPreviewTitle: string;
  emptyPrompt: string;

  // ── webview: history ──
  historyBadge: string;
  clearHistory: string;
  noHistory: string;
  historyPreview: string;
  historyRestore: string;
  historyDelete: string;
  fullPromptTitle: string;
  historyCopyBtn: string;

  // ── prompt output: section headers & intro text ──
  promptSkillHeader: string;
  promptBackgroundHeader: string;
  promptBackgroundIntro: string;
  promptRequirementHeader: string;
  promptValidationHeader: string;
  /** The *other* language's requirement header (for parsing old history). */
  promptRequirementHeaderAlt: string;
  /** The *other* language's validation header (for parsing old history). */
  promptValidationHeaderAlt: string;

  // ── webview: toast ──
  toastCopied: string;
  toastSkillSelected: string;
  toastRestored: string;
  toastCopiedShort: string;

  // ── webview: relative time ──
  timeJustNow: string;
  timeMinutesAgo: string;
  timeHoursAgo: string;
  timeDaysAgo: string;

  // ── default presets ──
  presetAdjustStyleLabel: string;
  presetAdjustStyleValue: string;
  presetTroubleshootLabel: string;
  presetTroubleshootValue: string;
  presetImplementFeatureLabel: string;
  presetImplementFeatureValue: string;
  presetRefineFeatureLabel: string;
  presetRefineFeatureValue: string;
  presetCodeReviewLabel: string;
  presetCodeReviewValue: string;
  presetAddCommentsLabel: string;
  presetAddCommentsValue: string;
  presetBuildPassesLabel: string;
  presetBuildPassesValue: string;

  // ── webview: skill agent labels ──
  skillAgentClaudeGlobal: string;
  skillAgentCursorGlobal: string;
  skillAgentCopilotGlobal: string;
  skillAgentClaudeProject: string;
  skillAgentCursorProject: string;
  skillAgentClineProject: string;
  skillAgentWindsurfProject: string;
  skillAgentCopilotProject: string;
  skillCopilotInstructionsName: string;
  skillCopilotInstructionsDesc: string;
}

// ── English (default) ──
const en: I18nMessages = {
  errorReadFile: 'Cannot read file: {0}',
  errorReadPath: 'Cannot get path info: {0}',
  errorOpenSkill: 'Cannot open skill file: {0}',

  editorBadge: 'Editor',
  clear: 'Clear',
  splitRight: '→ Split Right',
  openInWindow: '↗ New Window',
  langSwitchTo: '中文',

  sectionBackground: '📄 Background',
  sectionSkills: '📌 Select Skills',
  sectionRequirement: '💬 Requirements',
  sectionValidation: '✅ Validation',
  sectionHistory: '⏱ History',

  addManual: '＋ Add Manually',
  manualPlaceholder: 'Enter any text (path, note, URL…)',
  addBtn: 'Add',
  cancelBtn: 'Cancel',
  ctxEmptyHint: 'Right-click content in editor/terminal/explorer, or click "＋ Add Manually"',
  toggleExpand: 'Expand/Collapse',
  removeBtn: 'Remove',
  terminalOutput: 'Terminal output',
  manualNote: 'Manual note',

  addSkill: 'Add Skill… ▾',
  searchSkill: 'Search skills…',
  noMatchingSkill: 'No matching skills',
  openFile: 'Open file',

  selectPreset: 'Select Preset… ▼',
  managePresets: 'Manage Presets',
  noPresets: 'No presets',
  nameLabel: 'Name',
  contentLabel: 'Content',
  saveBtn: 'Save',
  editBtn: 'Edit',
  deleteBtn: 'Delete',
  addPreset: '＋ Add Preset',
  enterName: 'Please enter a name',

  requirementPlaceholder: 'Describe your requirements (optional)…',
  validationPlaceholder: 'Describe how to verify the changes…',

  previewBtn: '👁 Preview',
  copyBtn: '📋 Copy',
  closePreview: '👁 Close Preview',
  promptPreviewTitle: '👁 Prompt Preview',
  emptyPrompt: '(empty)',

  historyBadge: '0',
  clearHistory: 'Clear History',
  noHistory: 'No history yet',
  historyPreview: 'Preview',
  historyRestore: 'Use',
  historyDelete: 'Delete',
  fullPromptTitle: 'Full Prompt',
  historyCopyBtn: '📋 Copy',

  toastCopied: '✓ Prompt copied to clipboard',
  toastSkillSelected: '⚠ This skill is already selected',
  toastRestored: '✓ Restored from history',
  toastCopiedShort: '✓ Copied',

  timeJustNow: 'just now',
  timeMinutesAgo: '{0} minutes ago',
  timeHoursAgo: '{0} hours ago',
  timeDaysAgo: '{0} days ago',

  promptSkillHeader: '## Reference the following SKILL',
  promptBackgroundHeader: '## Background',
  promptBackgroundIntro: 'Reference the following files or folders:',
  promptRequirementHeader: '## Requirements',
  promptValidationHeader: '## Validation',
  promptRequirementHeaderAlt: '## 需求描述',
  promptValidationHeaderAlt: '## 验证方法',

  presetAdjustStyleLabel: 'Adjust Style',
  presetAdjustStyleValue: 'Help me adjust the style: ',
  presetTroubleshootLabel: 'Troubleshoot',
  presetTroubleshootValue: 'Help me troubleshoot: ',
  presetImplementFeatureLabel: 'Implement Feature',
  presetImplementFeatureValue: 'Help me implement the feature: ',
  presetRefineFeatureLabel: 'Refine Feature',
  presetRefineFeatureValue: 'Help me refine the feature: ',
  presetCodeReviewLabel: 'Code Review',
  presetCodeReviewValue: 'Help me do a code review: ',
  presetAddCommentsLabel: 'Add Comments',
  presetAddCommentsValue: 'Help me add comments: ',
  presetBuildPassesLabel: 'Project builds successfully',
  presetBuildPassesValue: 'Project builds successfully',

  skillAgentClaudeGlobal: 'Claude Code · Global',
  skillAgentCursorGlobal: 'Cursor · Global',
  skillAgentCopilotGlobal: 'Copilot · Global',
  skillAgentClaudeProject: 'Claude Code · Project',
  skillAgentCursorProject: 'Cursor · Project',
  skillAgentClineProject: 'Cline · Project',
  skillAgentWindsurfProject: 'Windsurf · Project',
  skillAgentCopilotProject: 'Copilot · Project',
  skillCopilotInstructionsName: 'Copilot Instructions',
  skillCopilotInstructionsDesc: 'VS Code Copilot instructions setting',
};

// ── Simplified Chinese ──
const zhCN: I18nMessages = {
  errorReadFile: '无法读取文件: {0}',
  errorReadPath: '无法获取路径信息: {0}',
  errorOpenSkill: '无法打开 skill 文件: {0}',

  editorBadge: '编辑器',
  clear: '清空',
  splitRight: '→ 向右分屏',
  openInWindow: '↗ 新窗口编辑',
  langSwitchTo: 'EN',

  sectionBackground: '📄 背景描述',
  sectionSkills: '📌 按需选择需要的 Skill',
  sectionRequirement: '💬 需求描述',
  sectionValidation: '✅ 验证方法',
  sectionHistory: '⏱ 历史记录',

  addManual: '＋ 手动添加',
  manualPlaceholder: '输入任意文字（路径、备注、URL…）',
  addBtn: '添加',
  cancelBtn: '取消',
  ctxEmptyHint: '右键编辑器/终端/资源管理器中的内容，或点击「＋ 手动添加」',
  toggleExpand: '展开/折叠',
  removeBtn: '删除',
  terminalOutput: 'Terminal output',
  manualNote: 'Manual note',

  addSkill: '添加 Skill… ▾',
  searchSkill: '搜索 skill…',
  noMatchingSkill: '无匹配 skill',
  openFile: '打开文件',

  selectPreset: '选择预设… ▼',
  managePresets: '管理预设',
  noPresets: '暂无预设',
  nameLabel: '名称',
  contentLabel: '内容',
  saveBtn: '保存',
  editBtn: '编辑',
  deleteBtn: '删除',
  addPreset: '＋ 添加预设',
  enterName: '请输入名称',

  requirementPlaceholder: '具体描述你的需求（可选）…',
  validationPlaceholder: '描述如何验证修改是否正确…',

  previewBtn: '👁 预览',
  copyBtn: '📋 复制',
  closePreview: '👁 关闭预览',
  promptPreviewTitle: '👁 Prompt 预览',
  emptyPrompt: '（空）',

  historyBadge: '0',
  clearHistory: '清空历史',
  noHistory: '暂无历史记录',
  historyPreview: '预览',
  historyRestore: '使用',
  historyDelete: '删除',
  fullPromptTitle: '完整 Prompt',
  historyCopyBtn: '📋 复制',

  toastCopied: '✓ Prompt 已复制到剪贴板',
  toastSkillSelected: '⚠ 该 Skill 已选择',
  toastRestored: '✓ 已从历史恢复',
  toastCopiedShort: '✓ 已复制',

  timeJustNow: '刚刚',
  timeMinutesAgo: '{0}分钟前',
  timeHoursAgo: '{0}小时前',
  timeDaysAgo: '{0}天前',

  promptSkillHeader: '## 参考使用以下 SKILL',
  promptBackgroundHeader: '## 背景描述',
  promptBackgroundIntro: '参考以下文件或者文件夹的内容:',
  promptRequirementHeader: '## 需求描述',
  promptValidationHeader: '## 验证方法',
  promptRequirementHeaderAlt: '## Requirements',
  promptValidationHeaderAlt: '## Validation',

  presetAdjustStyleLabel: '调整样式',
  presetAdjustStyleValue: '帮我调整样式：',
  presetTroubleshootLabel: '排查问题',
  presetTroubleshootValue: '帮我排查问题：',
  presetImplementFeatureLabel: '实现功能',
  presetImplementFeatureValue: '帮我实现功能：',
  presetRefineFeatureLabel: '完善功能',
  presetRefineFeatureValue: '帮我完善功能：',
  presetCodeReviewLabel: '代码审查',
  presetCodeReviewValue: '帮我做代码审查：',
  presetAddCommentsLabel: '添加注释',
  presetAddCommentsValue: '帮我添加注释：',
  presetBuildPassesLabel: '项目构建通过',
  presetBuildPassesValue: '项目构建通过',

  skillAgentClaudeGlobal: 'Claude Code · 全局',
  skillAgentCursorGlobal: 'Cursor · 全局',
  skillAgentCopilotGlobal: 'Copilot · 全局',
  skillAgentClaudeProject: 'Claude Code · 项目',
  skillAgentCursorProject: 'Cursor · 项目',
  skillAgentClineProject: 'Cline · 项目',
  skillAgentWindsurfProject: 'Windsurf · 项目',
  skillAgentCopilotProject: 'Copilot · 项目',
  skillCopilotInstructionsName: 'Copilot Instructions',
  skillCopilotInstructionsDesc: 'VS Code Copilot instructions setting',
};

// ── helpers ──

/** Cached language preference; set via setLang() by the provider on startup and on toggle. */
let _storedLang: 'en' | 'zh-cn' | null = null;

/** Return the active language code. Defaults to English unless the user has switched. */
export function getLang(): 'en' | 'zh-cn' {
  return _storedLang ?? 'en';
}

/** Update the active language and persist via the supplied callback. */
export function setLang(lang: 'en' | 'zh-cn', persist?: (lang: 'en' | 'zh-cn') => void): void {
  _storedLang = lang;
  persist?.(lang);
}

/** Look up a translated message, substituting {0}, {1}, … with the provided args. */
export function t(key: keyof I18nMessages, ...args: string[]): string {
  const lang = getLang();
  let msg: string = lang === 'zh-cn' ? (zhCN[key] ?? en[key]) : en[key];
  for (let i = 0; i < args.length; i++) {
    msg = msg.replace(`{${i}}`, args[i]);
  }
  return msg;
}

/** Get the messages map for the active language (used to inject into the webview JS). */
export function getWebviewMessages(): I18nMessages {
  return getLang() === 'zh-cn' ? zhCN : en;
}

/** Build the default preset list for the active language. */
export function getDefaultPresets(): Array<{ label: string; value: string }> {
  const m = getWebviewMessages();
  return [
    { label: m.presetAdjustStyleLabel, value: m.presetAdjustStyleValue },
    { label: m.presetTroubleshootLabel, value: m.presetTroubleshootValue },
    { label: m.presetImplementFeatureLabel, value: m.presetImplementFeatureValue },
    { label: m.presetRefineFeatureLabel, value: m.presetRefineFeatureValue },
    { label: m.presetCodeReviewLabel, value: m.presetCodeReviewValue },
    { label: m.presetAddCommentsLabel, value: m.presetAddCommentsValue },
  ];
}

/** Build the default validation preset list for the active language. */
export function getDefaultValidationPresets(): Array<{ label: string; value: string }> {
  const m = getWebviewMessages();
  return [{ label: m.presetBuildPassesLabel, value: m.presetBuildPassesValue }];
}

/** Get skill agent labels for the active language. */
export function getSkillAgentLabels(): Record<string, string> {
  const m = getWebviewMessages();
  return {
    claudeGlobal: m.skillAgentClaudeGlobal,
    cursorGlobal: m.skillAgentCursorGlobal,
    copilotGlobal: m.skillAgentCopilotGlobal,
    claudeProject: m.skillAgentClaudeProject,
    cursorProject: m.skillAgentCursorProject,
    clineProject: m.skillAgentClineProject,
    windsurfProject: m.skillAgentWindsurfProject,
    copilotProject: m.skillAgentCopilotProject,
    copilotInstructionsName: m.skillCopilotInstructionsName,
    copilotInstructionsDesc: m.skillCopilotInstructionsDesc,
  };
}
