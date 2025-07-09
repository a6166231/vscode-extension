import * as vscode from 'vscode';
import { FileWatcher } from './features/fileWatcher';
import { SkinItemProvider } from './provider/skinItemProvider';
import { WingConfig } from './features/wingConfig';
export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "egret-nb" is now active!');
	try {
		// 初始化文件监听器
		const fileWatcher = new FileWatcher();
		const wingCfg = new WingConfig();
		wingCfg.initListener(fileWatcher);
		// 注册清理函数
		context.subscriptions.push({
			dispose: () => {
				fileWatcher.dispose();
				wingCfg.dispose();
				// TerminalMgr.instance.dispose();
			}
		});
		vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'typescript' }, new SkinItemProvider);
	} catch (error) {
		console.error('Error during activation:', error);
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }