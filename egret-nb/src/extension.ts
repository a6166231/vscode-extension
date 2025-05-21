import * as vscode from 'vscode';
import { FileWatcher } from './features/fileWatcher';
import { SkinItemProvider } from './provider/skinItemProvider';
import { TerminalMgr } from './terminalMgr';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "egret-nb" is now active!');

	// 初始化文件监听器
	const fileWatcher = FileWatcher.getInstance();
	// 注册清理函数
	context.subscriptions.push({
		dispose: () => {
			fileWatcher.dispose();
			TerminalMgr.instance.dispose();
		}
	});

	vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'typescript' }, new SkinItemProvider);
}

// This method is called when your extension is deactivated
export function deactivate() { }
