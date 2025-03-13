import * as vscode from 'vscode';
import { FileWatcher } from './features/fileWatcher';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "egret-res-refresh" is now active!');

	// 初始化文件监听器
	const fileWatcher = FileWatcher.getInstance();
	// 注册清理函数
	context.subscriptions.push({
		dispose: () => {
			fileWatcher.dispose();
		}
	});
}

// This method is called when your extension is deactivated
export function deactivate() { }
