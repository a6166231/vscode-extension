
import { Project, Node, SyntaxKind, KindToNodeMappings } from 'ts-morph';

export class AST {

    private static _project: Project;

    /** 每次打开公用同一个project 之后再加载sourceFile的时候先get一次看能否从缓存中get到 */
    public static get Project() {
        if (!AST._project) {
            AST._project = new Project();
        }
        return AST._project;
    }

    public static clear() {
        this._project = null as any;
    }

    public static getSourceByPath(path: string) {
        return AST.Project.getSourceFile(path);
    }

    public static getDirByPath(path: string) {
        return AST.Project.getDirectory(path);
    }

    public static formatSourceByStr(path: string, str: string) {
        let p = AST.Project;
        return p.createSourceFile(path, str, { overwrite: true });
    }

    public static DeepFindParentByType<T extends SyntaxKind>(node: Node, type: T): KindToNodeMappings[T] | undefined {
        let parent = node.getParent();
        if (parent) {
            if (parent.getKind() === type) {
                return parent as KindToNodeMappings[T];
            } else {
                return AST.DeepFindParentByType(parent, type);
            }
        }
    }

}