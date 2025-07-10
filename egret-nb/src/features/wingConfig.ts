import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

let wingProperties: any = null;
let resourceWatcher: Array<{ configPath: string, abspath: string, relativePath: string, data?: any, dirtyMap: Map<string, any> }> = [];
let workspacePath: string = '';
let _delayRefreshSet: Set<string> = new Set();
let _delayTimer: NodeJS.Timeout | null = null;
export class WingConfig {
    constructor() {
        this.loadConfig();
    }
    public loadConfig() {
        workspacePath = vscode.workspace.rootPath || '';
        console.log('workspacePath:', workspacePath);
        const wingPropertiesPath = path.join(workspacePath, 'wingProperties.json');
        try {
            fs.readFile(wingPropertiesPath, 'utf-8', (err, content) => {
                wingProperties = JSON.parse(content);
                this.initWingResourcePlugin(workspacePath);
            });
        } catch (error) {
            console.log(error);
        }
    }

    public checkFileIsWingPro(filePath: string) {
        return filePath.indexOf('wingProperties.json') !== -1;
    }

    public getDirtyMapByFpath(fpath: string) {
        for (let item of resourceWatcher) {
            if (item.dirtyMap.has(fpath)) {
                return [item, item.dirtyMap.get(fpath)];
            }
        }
        return [];
    }

    public initListener(fileWatcher: any) {
        fileWatcher.onDidChange((fpath: string) => {
            this.onFileStatusChange(fpath);
        });
        // fileWatcher.onDidAdd((fpath: string) => {
        //     this.onFileStatusChange(fpath);
        // });
    }

    onFileStatusChange(fpath: string) {
        fpath = fpath.replace(/\\/g, '/');
        console.log('onFileStatusChange', fpath);
        if (this.checkFileIsWingPro(fpath) || resourceWatcher.some(item => !item.dirtyMap.has(fpath))) {
            return;
        }
        _delayRefreshSet.add(fpath);
        console.log('_delayRefreshSet  :', _delayRefreshSet);

        if (_delayTimer) {
            return;
        }
        _delayTimer = setTimeout(() => {
            this.readyRefreshFPathList();
            _delayTimer = null;
        }, 500);
    }

    public readyRefreshFPathList() {
        if (!_delayRefreshSet.size) {
            return;
        }
        let refreshList = Array.from(_delayRefreshSet.values());
        for (let item of resourceWatcher) {
            this.resourceJsonUpdateCall(item, (v: string) => {
                for (let fpath of refreshList) {
                    if (!item.dirtyMap.has(fpath)) {
                        continue;
                    }
                    let data = item.dirtyMap.get(fpath);
                    try {
                        let json = JSON.parse(fs.readFileSync(path.join(item.relativePath, data.url), 'utf-8'));
                        let keys = Object.keys(json.frames || {});
                        data.subkeys = keys.sort().join(',');
                        let r = JSON.stringify(item.data, null, '\t');
                        console.log(r, v);
                        if (r !== v) {
                            this.refreshResourcesJsonData(item.configPath, r);
                        }
                        console.log('更新成功', fpath);
                    } catch (error) {
                        console.log('更新失败', fpath, ':', error);
                    }
                }
            });
        }
        _delayRefreshSet.clear();
    }

    public refreshResourcesJsonData(jsonPath: string, data: string, successCallback?: () => void) {
        data = data.replace(/\n/g, '\r\n');
        fs.writeFile(path.join(workspacePath, jsonPath), data, 'utf-8', (err) => {
            if (err) {
                console.error('刷新资源配置文件失败:', jsonPath, err);
                return;
            }
            if (successCallback) {
                successCallback();
            }
            vscode.window.showInformationMessage('刷新成功');
            console.log('刷新成功');
        });
    }

    private clearWingResourcePlugin() {
        // for (let item of resourceWatcher) {
        //     item.watcher && item.watcher.dispose();
        // }
        resourceWatcher = [];
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
            // let watcher = vscode.workspace.createFileSystemWatcher(path.join(workspacePath, cfg.configPath));
            let obj = {
                configPath: cfg.configPath,
                relativePath: path.join(workspacePath, cfg.relativePath).replace(/\\/g, '/'),
                // watcher: watcher,
                abspath: path.join(workspacePath, cfg.configPath).replace(/\\/g, '/'),
                dirtyMap: new Map<string, any>()
            };
            this.resourceJsonUpdateCall(obj, null);
            resourceWatcher.push(obj);
        }
    }
    private resourceJsonUpdateCall(obj: any, endCall: any) {
        fs.readFile(obj.abspath, 'utf-8', (err, v) => {
            if (err) {
                console.error('读取资源配置文件失败:', obj.abspath, err);
                return;
            }
            obj.dirtyMap.clear();
            let json = JSON.parse(v);
            obj.data = json;
            for (let res of json.resources) {
                if (res.url) {
                    obj.dirtyMap.set(obj.relativePath + res.url, res);
                }
            }
            endCall && endCall(v);
        });
    }

    public getProperties(): any {
        return wingProperties;
    }

    public hasValidConfig(): boolean {
        return wingProperties !== null;
    }

    public dispose() {
        this.clearWingResourcePlugin();
        wingProperties = null;
        workspacePath = '';
    }
}