import * as vscode from 'vscode';

export enum CustomRuleType {
    send = 'send',
    table = 'table',
    enable = 'enable'
}

export class LocalCfg {
    private _cfg: Record<string, string> = null as any;

    private _typeEnable: boolean = true;

    private _keyBakMap: Record<string, Array<string>> = null as any;

    private _sender: {
        uri: vscode.Uri | null, pos: vscode.Position | null
    } = null as any;

    private _inited: boolean = false;

    private static _instance: LocalCfg;
    static Instance() {
        if (!this._instance) {
            this._instance = new LocalCfg();
        }
        return this._instance;
    }

    constructor() {
        this._initCfgChangeListener();
        this._initCfg();
    }

    private _initCfgChangeListener() {
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('supernotice')) {
                this._initCfg(true);
            }
        });
    }

    private _initCfg(bForce: boolean = false) {
        if (!bForce && this._inited) {
            return;
        }

        this._inited = true;
        let cfg: Record<string, string> = vscode.workspace.getConfiguration("supernotice").get("noticeLink", {});

        this._typeEnable = vscode.workspace.getConfiguration("supernotice").get("typeEnable", true);

        this._cfg = cfg;
        this._keyBakMap = {};

        let sendCfg = cfg[CustomRuleType.send];
        if (sendCfg) {
            let lastIdx = sendCfg.lastIndexOf(':');
            if (lastIdx >= 0) {
                try {
                    let uri = vscode.Uri.parse(sendCfg.substring(0, lastIdx));
                    let pos: Array<number> = [0, 0];
                    pos = JSON.parse(sendCfg.substring(lastIdx + 1));
                    this._sender = {
                        uri: uri,
                        pos: new vscode.Position(pos[0], pos[1])
                    };
                } catch (error) {
                    console.log(error);
                }
            }
        }
        vscode.commands.executeCommand('setContext', 'supernotice.status.ready', Boolean(this._sender));
    }

    getTableCfg() {
        if (!this._inited) {
            this._initCfg();
        }
        return this._cfg[CustomRuleType.table];
    }

    getTypeEnable() {
        return this._typeEnable;
    }

    getSenderCfg() {
        if (!this._inited) {
            this._initCfg();
        }
        return this._sender;
    }

    setCustomSender(document: vscode.LocationLink, range: vscode.Range) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage(`设置失败`);
            return;
        }

        let starIdx = [range.start.line, range.start.character];
        let sendS = `${vscode.workspace.asRelativePath(document.targetUri.fsPath)}:${JSON.stringify(starIdx)}`;
        let cfg: Record<string, string> = vscode.workspace.getConfiguration("supernotice").get("noticeLink", {});

        cfg[CustomRuleType.send] = sendS;
        vscode.workspace.getConfiguration("supernotice").update('noticeLink', cfg, vscode.ConfigurationTarget.Workspace, true).then((res) => {
            vscode.window.showInformationMessage(`设置成功`);
        }, (err) => {
            vscode.window.showInformationMessage(`设置失败`);
            console.log(err);
        });
    }
}