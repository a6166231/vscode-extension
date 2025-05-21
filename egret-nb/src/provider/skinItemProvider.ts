import * as vscode from 'vscode';
import { TerminalMgr } from '../terminalMgr';

export class SkinItemProvider implements vscode.DefinitionProvider {
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        let range = document.getWordRangeAtPosition(position);
        let select = document.getText(range);
        vscode.workspace.findFiles(`**/${select}.exml`).then((uris) => {
            if (uris.length === 0) {
                return;
            }
            TerminalMgr.instance.executeCommand(`wing -r ${uris[0].fsPath}`);
        });
        return [];
    }
}