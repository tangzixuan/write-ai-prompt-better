import * as vscode from 'vscode';
import { genId, WriteBetterPromptProvider } from './WriteBetterPromptProvider';
import { ContextItem } from './types';
import { t } from './i18n';

/**
 * Extension activation entry point. Registers the webview view provider and all
 * commands (Command Palette + context-menu triggers).
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const provider = new WriteBetterPromptProvider(context);
  await provider.loadState();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(WriteBetterPromptProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  context.subscriptions.push(
    // Open / focus the sidebar panel.
    vscode.commands.registerCommand('writeBetterPrompt.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.writeBetterPrompt');
    }),

    // Open a standalone editor tab beside the active column.
    vscode.commands.registerCommand('writeBetterPrompt.openEditor', () => {
      provider.openEditorPanel(vscode.ViewColumn.Beside);
    }),

    // Clear all context items and reset every view's private state.
    vscode.commands.registerCommand('writeBetterPrompt.clearAll', () => {
      provider.clearAll();
    }),

    // Editor right-click — add the selected code as a file context item.
    vscode.commands.registerCommand('writeBetterPrompt.addFileContent', addFileContentHandler(provider)),

    // Editor tab right-click — add the whole file content as a context item.
    vscode.commands.registerCommand('writeBetterPrompt.addFileToContext', addFileToContextHandler(provider)),

    // Terminal right-click — add the selected terminal output.
    vscode.commands.registerCommand('writeBetterPrompt.addTerminalContent', addTerminalContentHandler(provider)),

    // Explorer right-click — add a file/folder path reference.
    vscode.commands.registerCommand('writeBetterPrompt.addPathToContext', addPathToContextHandler(provider)),
  );

  context.subscriptions.push(provider);
}

export function deactivate(): void {
  // no-op
}

// ---------------------------------------------------------------- helpers

/** Normalise a command argument (single Uri or Uri[] from multi-select) to one Uri. */
function toUri(resource: unknown): vscode.Uri | undefined {
  if (resource instanceof vscode.Uri) {
    return resource;
  }
  if (Array.isArray(resource) && resource.length > 0 && resource[0] instanceof vscode.Uri) {
    return resource[0];
  }
  return undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------- command handlers

function addFileContentHandler(provider: WriteBetterPromptProvider): () => void {
  return () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      return;
    }
    const doc = editor.document;
    const selection = editor.selection;
    const text = doc.getText(selection);
    const filePath = doc.uri.fsPath;
    const startLine = selection.start.line + 1;
    const endLine = selection.end.line + 1;
    const lineRange = startLine === endLine ? 'L' + startLine : 'L' + startLine + '-' + endLine;

    const item: ContextItem = {
      id: genId(),
      type: 'file',
      content: text,
      filePath,
      lineRange,
      timestamp: Date.now(),
    };
    // Copy the code snippet to the clipboard for immediate pasting.
    void vscode.env.clipboard.writeText(text);
    provider.addContextItem(item);
  };
}

function addFileToContextHandler(provider: WriteBetterPromptProvider): (resource?: unknown) => Promise<void> {
  return async (resource?: unknown) => {
    const targetUri = toUri(resource) ?? vscode.window.activeTextEditor?.document.uri;
    if (!targetUri) {
      return;
    }
    try {
      const buf = await vscode.workspace.fs.readFile(targetUri);
      const content = Buffer.from(buf).toString('utf8');
      const item: ContextItem = {
        id: genId(),
        type: 'file',
        content,
        filePath: targetUri.fsPath,
        timestamp: Date.now(),
      };
      provider.addContextItem(item);
    } catch {
      vscode.window.showErrorMessage(t('errorReadFile', targetUri.fsPath));
    }
  };
}

function addTerminalContentHandler(provider: WriteBetterPromptProvider): () => Promise<void> {
  return async () => {
    // VS Code cannot read the terminal selection directly; copy it to the
    // clipboard first, wait briefly, then read the clipboard back.
    await vscode.commands.executeCommand('workbench.action.terminal.copySelection');
    await delay(150);
    const text = await vscode.env.clipboard.readText();
    if (!text) {
      return;
    }
    const item: ContextItem = {
      id: genId(),
      type: 'terminal',
      content: text,
      timestamp: Date.now(),
    };
    provider.addContextItem(item);
  };
}

function addPathToContextHandler(provider: WriteBetterPromptProvider): (resource: unknown) => Promise<void> {
  return async (resource: unknown) => {
    const uri = toUri(resource);
    if (!uri) {
      return;
    }
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      const isDir = (stat.type & vscode.FileType.Directory) !== 0;
      const item: ContextItem = {
        id: genId(),
        type: isDir ? 'folder' : 'fileRef',
        content: '',
        filePath: uri.fsPath,
        timestamp: Date.now(),
      };
      provider.addContextItem(item);
    } catch {
      vscode.window.showErrorMessage(t('errorReadPath', uri.fsPath));
    }
  };
}
