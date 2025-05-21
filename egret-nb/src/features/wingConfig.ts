import * as fs from 'fs';
import * as path from 'path';
import { FileWatcher } from './fileWatcher';
import * as vscode from 'vscode';

export class WingConfig {
    private wingProperties: any = null;

    private workspacePath: string = '';

    private resourceWatcher: Array<{ configPath: string, abspath: string, relativePath: string, watcher: vscode.FileSystemWatcher | null, data?: any, dirtyMap: Map<string, any> }> = [];

    public static wingPropertyPath = 'wingProperties.json';

    private static _instance: WingConfig;
    public static getInstance(...args: any[]) {
        if (!this._instance) {
            this._instance = Reflect.construct(this, args);
        }
        return this._instance;
    }
    protected constructor() {
    }

    public async loadConfig(workspacePath: string): Promise<boolean> {
        this.workspacePath = workspacePath;
        const wingPropertiesPath = path.join(workspacePath, WingConfig.wingPropertyPath);
        try {
            await fs.promises.access(wingPropertiesPath);
            const content = await fs.promises.readFile(wingPropertiesPath, 'utf-8');
            this.wingProperties = JSON.parse(content);
            this.initWingResourcePlugin(workspacePath);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    public checkFileIsWingPro(filePath: string) {
        return filePath.indexOf(WingConfig.wingPropertyPath) !== -1;
    }

    public getDirtyMapByFpath(fpath: string) {
        for (let item of this.resourceWatcher) {
            if (item.dirtyMap.has(fpath)) {
                return [item, item.dirtyMap.get(fpath)];
            }
        }
        return [];
    }

    private _delayRefreshSet: Set<string> = new Set();
    private _delayTimer: NodeJS.Timeout | null = null;
    public initListener() {
        FileWatcher.getInstance().onDidChange((fpath, uri) => {
            this.onFileStatusChange(fpath);
        });
        FileWatcher.getInstance().onDidAdd((fpath, uri) => {
            this.onFileStatusChange(fpath);
        });
        // FileWatcher.getInstance().onDidDelete((fpath, uri) => {
        //     this.onFileStatusChange(fpath);
        // });
    }

    onFileStatusChange(fpath: string) {
        fpath = fpath.replaceAll('\\', '/');
        if (this.checkFileIsWingPro(fpath)) {
            return;
        }
        this._delayRefreshSet.add(fpath);

        if (this._delayTimer) {
            return;
        }
        this._delayTimer = setTimeout(() => {
            this.readyRefreshFPathList();
            this._delayTimer = null;
        }, 500);
    }

    public readyRefreshFPathList() {
        if (!this._delayRefreshSet.size) {
            return;
        }
        for (let fpath of this._delayRefreshSet) {
            for (let item of this.resourceWatcher) {
                if (!item.dirtyMap.has(fpath)) {
                    continue;
                }
                let data = item.dirtyMap.get(fpath);

                try {
                    let json = JSON.parse(fs.readFileSync(path.join(this.workspacePath, item.relativePath, data.url), 'utf-8'));
                    let keys = Object.keys(json.frames || {});
                    data.subkeys = keys.sort().join(',');
                    this.refreshResourcesJsonData(item.configPath, JSON.stringify(item.data, null, '\t'));
                    console.log('更新成功', fpath, ':', data.subkeys);
                } catch (error) {
                    console.log('更新失败', fpath, ':', error);
                }
            }
        }
        this._delayRefreshSet.clear()
    }

    public refreshResourcesJsonData(jsonPath: string, data: string) {
        fs.promises.writeFile(path.join(this.workspacePath, jsonPath), data, 'utf-8').then(() => {
            console.log('刷新成功');
        }).catch((err) => {
            console.log('刷新失败', err);
        });
    }

    private clearWingResourcePlugin() {
        for (let item of this.resourceWatcher) {
            item.watcher?.dispose();
        }
        this.resourceWatcher = [];
    }

    private initWingResourcePlugin(workspacePath: string) {
        this.clearWingResourcePlugin();
        let properties = this.getProperties();
        if (!properties || !properties['resourcePlugin']) {
            return;
        }

        let cfgs = properties.resourcePlugin.configs || [];

        if (!cfgs.length) {
            return;
        }

        for (let cfg of cfgs) {
            let watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspacePath, cfg.configPath));
            let obj = {
                configPath: cfg.configPath,
                relativePath: cfg.relativePath,
                watcher: watcher,
                abspath: path.join(workspacePath, cfg.configPath),
                dirtyMap: new Map<string, any>()
            };
            watcher.onDidChange(() => {
                this.resourceJsonUpdateCall(obj);
            });
            this.resourceJsonUpdateCall(obj);
            this.resourceWatcher.push(obj);
        }
    }

    private resourceJsonUpdateCall(obj: any) {
        let json = JSON.parse(fs.readFileSync(obj.abspath, 'utf-8'));
        obj.data = json;

        for (let res of json.resources) {
            if (res.url) {
                obj.dirtyMap.set(obj.relativePath + res.url, res);
            }
        }

    }

    public getProperties(): any {
        return this.wingProperties;
    }

    public hasValidConfig(): boolean {
        return this.wingProperties !== null;
    }
}