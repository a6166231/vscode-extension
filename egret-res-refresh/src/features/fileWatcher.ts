import * as vscode from 'vscode';
import * as path from 'path';
import { WingConfig } from './wingConfig';

type FileChangeCallback = (relativePath: string, uri: vscode.Uri) => void;

export class FileWatcher {
    private fileSystemWatcher: vscode.FileSystemWatcher | null = null;
    private wingCfgWatcher: vscode.FileSystemWatcher | null = null;

    private static _instance: FileWatcher;
    public static getInstance(...args: any[]) {
        if (!this._instance) {
            this._instance = Reflect.construct(this, args);
        }
        return this._instance;
    }
    // 回调函数注册表
    private deleteCallbacks: Set<FileChangeCallback> = new Set();
    private changeCallbacks: Set<FileChangeCallback> = new Set();

    protected constructor() {
        this.init();
    }

    private async init() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        // 检查是否存在 wingProperties.json 文件
        for (const folder of workspaceFolders) {
            if (await WingConfig.getInstance().loadConfig(folder.uri.fsPath)) {
                // this.wingCfgWatcher = vscode.workspace.createFileSystemWatcher(path.join(folder.uri.fsPath, WingConfig.wingPropertyPath));
                // this.wingCfgWatcher.onDidChange(uri => {
                //     WingConfig.getInstance().loadConfig(folder.uri.fsPath);
                // });
                WingConfig.getInstance().initListener();
                // 配置加载成功，初始化文件监听
                this.initFileWatcher();
                return;
            }
        }

        console.log('未检测到 Wing 项目，文件监听未启动');
    }

    private initFileWatcher() {
        this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*', true, false, false);

        // 监听文件删除事件
        this.fileSystemWatcher.onDidDelete(uri => {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (!workspaceFolder) {
                return;
            }

            const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);

            console.log(`文件删除事件：${relativePath}`);

            // 触发所有注册的删除回调
            this.deleteCallbacks.forEach(callback => callback(relativePath, uri));
        });

        // 监听文件修改事件
        this.fileSystemWatcher.onDidChange(uri => {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (!workspaceFolder) {
                return;
            }

            const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);

            console.log(`文件修改事件：${relativePath}`);

            // 触发所有注册的修改回调
            this.changeCallbacks.forEach(callback => callback(relativePath, uri));
        });
    }

    // 注册文件删除事件回调
    public onDidDelete(callback: FileChangeCallback): void {
        this.deleteCallbacks.add(callback);
    }

    // 注册文件修改事件回调
    public onDidChange(callback: FileChangeCallback): void {
        this.changeCallbacks.add(callback);
    }

    // 取消注册文件删除事件回调
    public offDidDelete(callback: FileChangeCallback): void {
        this.deleteCallbacks.delete(callback);
    }

    // 取消注册文件修改事件回调
    public offDidChange(callback: FileChangeCallback): void {
        this.changeCallbacks.delete(callback);
    }

    public dispose() {
        if (this.fileSystemWatcher) {
            this.fileSystemWatcher.dispose();
        }
        if (this.wingCfgWatcher) {
            this.wingCfgWatcher.dispose();
        }
        // 清空所有回调
        this.deleteCallbacks.clear();
        this.changeCallbacks.clear();
    }
}