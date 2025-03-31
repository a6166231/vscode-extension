import * as vscode from 'vscode';
import { CustomRuleType, LocalCfg } from './LocalCfg';
import { AST } from './AST';
import { SyntaxKind, SourceFile } from 'ts-morph';
import { CNReferenceCall } from './CNReferenceCall';
import path from 'path';

const tsTemp = `\n\`\`\`typescript\n%s\n\`\`\`\n`;

export class CNSignatureHelpProvider implements vscode.SignatureHelpProvider {
    private _lastNoticeCache: Map<string, vscode.SignatureHelp> = new Map;

    private _file2NoticeMap: Record<string, Set<string>> = {};

    constructor() {
        this._addListener();
    }

    private _addListener() {
        if (!vscode.workspace.workspaceFolders) { return; }
        const fileSystemWatcher = vscode.workspace.createFileSystemWatcher("**/*.ts", true, false, true);
        fileSystemWatcher.onDidChange(uri => {
            let set = this._file2NoticeMap[uri.path];
            if (set && set.size > 0) {
                for (let ff of set) {
                    this._lastNoticeCache.delete(ff);
                }
            }
        });
    }

    provideSignatureHelp(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.SignatureHelpContext,
    ): vscode.ProviderResult<vscode.SignatureHelp> {
        if (!LocalCfg.Instance().getTypeEnable()) { return; }

        let cfg = LocalCfg.Instance().getSenderCfg();
        if (!cfg) { return; }

        // const lineText = document.lineAt(position.line).text;
        // let index = lineText.indexOf(cfg);
        // if (index < 0) { return; }
        // let other = lineText.slice(index + cfg.length);
        // let firstItem = other.split(',')[0];
        // if (!firstItem) { return; }

        // if (this._lastNoticeCache.has(firstItem)) {
        //     return this._lastNoticeCache.get(firstItem);
        // }

        if (context.isRetrigger) { return; }

        this.readyShowAllReciverModel(document, position).then(() => {
            this.show();
        });
        return;
    }

    private async readyShowAllReciverModel(
        document: vscode.TextDocument,
        position: vscode.Position
    ) {
        const lineText = document.lineAt(position.line).text;
        const signatureHelp = new vscode.SignatureHelp();
        signatureHelp.activeSignature = 0;
        signatureHelp.activeParameter = 0;

        let tableName = LocalCfg.Instance().getTableCfg() || 'NoticeTable';

        let cfg = LocalCfg.Instance().getSenderCfg();
        if (!cfg) {
            return;
        }

        let index = lineText.indexOf(cfg);
        if (index < 0) { return; }
        let other = lineText.slice(index + cfg.length);
        let firstItem = other.split(',')[0];
        if (!firstItem) { return; }

        let pos = new vscode.Position(position.line, index + cfg.length + firstItem.length);
        let localtions = await vscode.commands.executeCommand<vscode.Location[]>('vscode.executeReferenceProvider', document.uri, pos);
        let locations2 = await CNReferenceCall.checkLocationsListByRule(localtions, true);

        let bak: Set<string> = new Set;
        let status = false;
        for (let recivedItem of locations2) {
            if (path.basename(recivedItem.uri.path) === tableName + '.ts') { continue; }

            if (bak.has(recivedItem.uri.path)) { continue; }
            bak.add(recivedItem.uri.path);

            let contentBuffer = await vscode.workspace.fs.readFile(recivedItem.uri);
            let source = await AST.formatSourceByStr(recivedItem.uri.path, Buffer.from(contentBuffer).toString('utf8'));
            let sfunction = await this._GetFunctionStrBySourceInRange(source, recivedItem);
            if (!sfunction || sfunction.length === 0) {
                continue;
            }
            status = true;
            const signature = new vscode.SignatureInformation('');
            signature.documentation = new vscode.MarkdownString(sfunction);
            signatureHelp.signatures.push(signature);

            let set = this._file2NoticeMap[recivedItem.uri.path];
            if (!set) {
                set = new Set;
                this._file2NoticeMap[recivedItem.uri.path] = set;
            }
            set.add(firstItem);
        }
        if (status) {
            this._lastNoticeCache.set(firstItem, signatureHelp);
        }
    }

    private async _GetFunctionStrBySourceInRange(source: SourceFile, location: vscode.Location) {
        let startLine = location.range.end.line;
        let startChar = location.range.end.character;

        let fullLines = source.getFullText().split('\n');

        let lastPos = startChar + startLine - 1;
        for (let i = 0; i < startLine; i++) {
            lastPos += fullLines[i].length;
        }

        let item = source.getDescendantAtPos(lastPos);
        if (!item) { return; }

        let caller = AST.DeepFindParentByType(item, SyntaxKind.CallExpression);
        if (!caller) {
            return;
        }

        let args = caller.getArguments() || [];

        if (args[0].getText().indexOf(item.getText()) < 0) { return; }

        let callerPos: number = -1;

        if (caller.isKind(SyntaxKind.ArrowFunction) || caller.isKind(SyntaxKind.FunctionExpression)) {
            return tsTemp.replace('%s', `(${caller.getParameters().map(v => {
                return v.getText();
            }).join(' ,')}) => ${caller.getReturnType()?.getText() || 'void'}`);
        } else if (caller.isKind(SyntaxKind.CallExpression)) {
            callerPos = args[1]?.getEnd() || -1;
        }

        if (callerPos < 0) { return; }
        let lineCol = source.getLineAndColumnAtPos(callerPos);
        let pos = new vscode.Position(lineCol.line - 1, lineCol.column - 1);

        let helper = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', location.uri, pos);
        if (helper && helper.length) {
            let contents = helper[0].contents as vscode.MarkdownString[] || [];
            return contents.map(v => v.value).join('\n');
        }
    }

    show() {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            vscode.commands.executeCommand(
                'editor.action.triggerParameterHints',
                activeEditor.document.uri,
                activeEditor.selection.active,
            );
        }
    }
}