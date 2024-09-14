import * as vscode from 'vscode';

export enum CustomRuleType {
    send = 'send',
    recive = 'recive',
    table = 'table',
    enable = 'enable'
}

export class LocalCfg {
    private _cfg: Record<string, string> = null as any;

    private _typeEnable: boolean = true;

    private _keyBakMap: Record<string, Array<string>> = null as any;

    private static _instance: LocalCfg;
    static Instance() {
        if (!this._instance) {
            this._instance = new LocalCfg();
        }
        return this._instance;
    }

    constructor() {
        this._initCfgChangeListener();
    }

    private _initCfgChangeListener() {
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('supernotice')) {
                this._initCfg();
            }
        });
    }

    private _initCfg() {
        let cfg: Record<string, string> = vscode.workspace.getConfiguration("supernotice").get("noticeLink", {});

        this._typeEnable = vscode.workspace.getConfiguration("supernotice").get("typeEnable", true);

        this._cfg = cfg;
        this._keyBakMap = {};
        if (cfg[CustomRuleType.send]) {
            this._keyBakMap[CustomRuleType.send] = cfg[CustomRuleType.send].split('|');
        }

        if (cfg[CustomRuleType.recive]) {
            this._keyBakMap[CustomRuleType.recive] = cfg[CustomRuleType.recive].split('|');
        }
    }

    getTypeEnable() {
        return this._typeEnable;
    }

    getCfg(type: CustomRuleType) {
        if (!this._cfg) {
            this._initCfg();
        }
        return this._cfg[type] || '';
    }
    getCustomCfg(type: CustomRuleType) {
        if (!this._keyBakMap) {
            this._initCfg();
        }
        return this._keyBakMap[type];
    }
}