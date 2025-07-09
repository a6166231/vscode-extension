import * as vscode from 'vscode';
import * as path from 'path';

type FileChangeCallback = (relativePath: string, uri: vscode.Uri) => void;

let deleteCallbacks: Set<FileChangeCallback> = new Set();
let changeCallbacks: Set<FileChangeCallback> = new Set();
let addCallbacks: Set<FileChangeCallback> = new Set();

export class FileWatcher {
    constructor() {
        this.initFileWatcher();
    }

    private initFileWatcher() {
        console.log('初始化文件监听器');
        try {
            let fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.json', false, false, false);
            console.log(fileSystemWatcher);
            fileSystemWatcher.onDidDelete(uri => {
                // const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                // if (!workspaceFolder) {
                //     return;
                // }
                // const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
                console.log(`文件删除事件：${uri.fsPath}`);

                deleteCallbacks.forEach(callback => callback(uri.fsPath, uri));
            });
            fileSystemWatcher.onDidChange(uri => {
                // const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                // if (!workspaceFolder) {
                //     return;
                // }
                // const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
                console.log(`文件修改事件：${uri.fsPath}`);
                changeCallbacks.forEach(callback => callback(uri.fsPath, uri));
            });
            fileSystemWatcher.onDidCreate(uri => {
                // const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
                // if (!workspaceFolder) {
                //     return;
                // }
                // const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
                console.log(`文件创建事件：${uri.fsPath}`);
                addCallbacks.forEach(callback => callback(uri.fsPath, uri));
            });
        } catch (error) {
            console.error('初始化文件监听器失败:', error);
        }
    }

    // 注册文件删除事件回调
    public onDidDelete(callback: FileChangeCallback): void {
        deleteCallbacks.add(callback);
    }

    // 注册文件修改事件回调
    public onDidChange(callback: FileChangeCallback): void {
        changeCallbacks.add(callback);
    }
    // 注册文件修改事件回调
    public onDidAdd(callback: FileChangeCallback): void {
        addCallbacks.add(callback);
    }

    // 取消注册文件删除事件回调
    public offDidDelete(callback: FileChangeCallback): void {
        deleteCallbacks.delete(callback);
    }

    // 取消注册文件修改事件回调
    public offDidChange(callback: FileChangeCallback): void {
        changeCallbacks.delete(callback);
    }

    // 取消注册文件修改事件回调
    public offDidAdd(callback: FileChangeCallback): void {
        addCallbacks.delete(callback);
    }

    public dispose() {
        // 清空所有回调
        addCallbacks.clear();
        changeCallbacks.clear();
        deleteCallbacks.clear();
    }
}