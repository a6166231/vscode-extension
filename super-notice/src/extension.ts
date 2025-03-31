// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands } from 'vscode';
import { CNSignatureHelpProvider } from './CNSignatureHelpProvider';
import { CustomRuleType, LocalCfg } from './LocalCfg';
import { CNReferenceCall } from './CNReferenceCall';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	LocalCfg.Instance();
	const senderCMD = commands.registerTextEditorCommand('supernotice.allSender', (editor) => {
		CNReferenceCall.allNoticeFormat(editor);
	});
	const reciveCMD = commands.registerTextEditorCommand('supernotice.allReciver', (editor) => {
		CNReferenceCall.allNoticeFormat(editor, true);
	});
	const SetCMD = commands.registerTextEditorCommand('supernotice.setSender', async (editor) => {
		CNReferenceCall.setSenderInfo(editor);
	});
	context.subscriptions.push(senderCMD, reciveCMD, SetCMD);
	vscode.languages.registerSignatureHelpProvider({ language: 'typescript' }, new CNSignatureHelpProvider(), ',');
}

// This method is called when your extension is deactivated
export function deactivate() { }