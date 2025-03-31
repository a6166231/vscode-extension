import * as vscode from 'vscode';
import { LocalCfg } from './LocalCfg';

export class CNReferenceCall {

    static async CheckSenderByPos(pos: vscode.Position) {
        return false;
    }
    static async CheckSenderByRange(uri: vscode.Uri, range: vscode.Range) {
        return false;
    }

    static async allNoticeFormat(editor: vscode.TextEditor, reserver?: boolean) {
        const target = editor.document.uri;
        const pos = editor.selection.active;

        vscode.commands.executeCommand<vscode.Location[]>('vscode.executeReferenceProvider', target, pos).then(async locations => {
            locations = await this.checkLocationsListByRule(locations || [], reserver);
            this.showReferences(locations);
        });
    }

    static async checkLocationsListByRule(locations: Array<vscode.Location>, reserver?: boolean) {
        let sender = LocalCfg.Instance().getSenderCfg();
        if (sender) {
            let subRuleStatus = reserver;
            for (let i = 0; i < locations.length; i++) {
                let location = locations[i];
                // const document = await vscode.workspace.openTextDocument(location.uri);
                // const lineText = document.lineAt(location.range.start.line).text;
                let status = await CNReferenceCall.CheckSenderByRange(location.uri, location.range);
                if (subRuleStatus && !status || (!subRuleStatus && status)) {
                    status = true;
                }
                if (!status) {
                    locations.splice(i, 1);
                    i--;
                }
            }
        }
        return locations;
    }

    static async setSenderInfo(editor: vscode.TextEditor) {
        const position = editor.selection.active;
        const document = editor.document;
        const defs = await vscode.commands.executeCommand<vscode.LocationLink[]>(
            'vscode.executeDefinitionProvider',
            document.uri, position
        );

        if (!defs || !defs.length) {
            popUnanble();
            return;
        }
        const def = defs[0];

        let range = def.targetSelectionRange;
        if (!range) {
            popUnanble();
            return;
        }

        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            def.targetUri
        );

        if (!symbols) {
            popUnanble();
            return;
        }

        const txtDoc = await vscode.workspace.openTextDocument(def.targetUri);

        const selectedSymbol = findSymbolAtPosition(symbols, range!, txtDoc.getText(range));
        if (selectedSymbol) {
            if (selectedSymbol.kind === vscode.SymbolKind.Method) {
                LocalCfg.Instance().setCustomSender(def, range);
            } else {
                vscode.window.showInformationMessage(`"${selectedSymbol.name}" 介似个方法嘛?`);
            }
        } else {
            popUnanble();
        }
    }

    static showReferences(locations: Array<vscode.Location>) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            vscode.commands.executeCommand(
                'editor.action.showReferences',
                activeEditor.document.uri,
                activeEditor.selection.active,
                locations
            );
        }
    }
}

function popUnanble() {
    vscode.window.showInformationMessage(`选了个嘛? 我问你选了个嘛?`);
}

function findSymbolAtPosition(symbols: vscode.DocumentSymbol[], range: vscode.Range, name: string): vscode.DocumentSymbol | undefined {
    for (const symbol of symbols) {
        if (symbol.range.contains(range) && symbol.name === name) {
            return symbol;
        }
        if (symbol.children) {
            const childSymbol = findSymbolAtPosition(symbol.children, range, name);
            if (childSymbol) {
                return childSymbol;
            }
        }
    }
}