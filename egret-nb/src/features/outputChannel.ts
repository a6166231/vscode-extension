import * as vscode from 'vscode';

export class OutputChannel {
    private outputChannel: vscode.OutputChannel = null as any;

    private static _instance: OutputChannel = null as any;
    protected constructor() { }
    static get instance() {
        if (!this._instance) {
            this._instance = new OutputChannel();
        }
        return this._instance;
    }

    init(context: vscode.ExtensionContext) {
        // this.outputChannel = vscode.window.createOutputChannel('EGRET_RES_REFRESH');
        // context.subscriptions.push(this.outputChannel);
        // this.outputChannel.appendLine('插件已激活！'); // 检查此日志是否出现
        // this.outputChannel.show(true);
    }

    deactivate() {
        // this.outputChannel.dispose(); // 释放资源
    }

    log(message: string) {
        console.log('@@@@@@@@@@@@@@@', message);
        // this.outputChannel.appendLine(message);
    }
}
