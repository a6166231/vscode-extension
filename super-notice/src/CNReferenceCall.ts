import * as vscode from 'vscode';
import { CustomRuleType, LocalCfg } from './LocalCfg';

export class CNReferenceCall {
    static async allNoticeFormat(editor: vscode.TextEditor, rule: CustomRuleType, subRule?: CustomRuleType) {
        const target = editor.document.uri;
        const pos = editor.selection.active;

        vscode.commands.executeCommand<vscode.Location[]>('vscode.executeReferenceProvider', target, pos).then(async locations => {
            locations = await this.checkLocationsListByRule(locations || [], rule, subRule);
            this.showReferences(locations);
        });
    }

    static async checkLocationsListByRule(locations: Array<vscode.Location>, rule: CustomRuleType, subRule?: CustomRuleType) {
        let links: Array<string> = LocalCfg.Instance().getCustomCfg(rule) || [];

        let subRuleStatus = false;
        if (links.length === 0 && subRule) {
            subRuleStatus = true;
            links = LocalCfg.Instance().getCustomCfg(subRule) || [];
        }

        if (links.length > 0) {
            for (let i = 0; i < locations.length; i++) {
                let location = locations[i];
                const document = await vscode.workspace.openTextDocument(location.uri);
                const lineText = document.lineAt(location.range.start.line).text;
                let status = false;
                for (let key of links) {
                    if (subRuleStatus && !lineText.includes(key) || (!subRuleStatus && lineText.includes(key))) {
                        status = true;
                        break;
                    }
                }
                if (!status) {
                    locations.splice(i, 1);
                    i--;
                }
            }
        }
        return locations;
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