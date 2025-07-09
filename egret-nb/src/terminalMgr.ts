// import * as vscode from "vscode";
// export class TerminalMgr {
//     private static _instance: TerminalMgr = null as any;
//     private _terminal: vscode.Terminal | null = null;
//     private _cmdList: string[] = [];
//     private _inited: boolean = false;
//     private constructor() { }
//     public static get instance() {
//         if (!this._instance) {
//             this._instance = new TerminalMgr();
//         }
//         return this._instance;
//     }
//     get terminal() {
//         if (!this._terminal) {
//             this._terminal = vscode.window.createTerminal({
//                 name: "egret-nb",
//             });
//             vscode.window.onDidChangeTerminalShellIntegration(({ terminal, shellIntegration }) => {
//                 if (terminal === this._terminal) {
//                     this._inited = true;
//                     if (this._cmdList.length) {
//                         for (let cmd of this._cmdList) {
//                             shellIntegration.executeCommand(cmd);
//                         }
//                         this._cmdList = [];
//                     }
//                 }
//             });
//         }
//         return this._terminal;
//     }

//     executeCommand(cmd: string) {
//         if (this.terminal && this.terminal.shellIntegration) {
//             this.terminal.shellIntegration.executeCommand(cmd);
//         } else {
//             this._cmdList.push(cmd);
//         }
//     }

//     dispose() {
//         this._terminal && this._terminal.dispose();
//     }
// }