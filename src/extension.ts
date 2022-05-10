// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('quickfixed.showQuickActions', showQuickActions);

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }

/** Show all quick actions under the cursor in a quick open window */
async function showQuickActions() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const actions = (await vscode.commands.executeCommand(
        "vscode.executeCodeActionProvider",
        editor.document.uri, editor.selection,
    )) as vscode.CodeAction[] | undefined;
    if (!actions) { return; }

    await chooseInQuickSelect(actions);
}

async function chooseInQuickSelect(actions: vscode.CodeAction[]) {
    const action = await vscode.window.showQuickPick(
        actions.map(action => new CodeActionItem(action))
    );
    if (!action) { return; }
    await action.execute();
}

class CodeActionItem implements vscode.QuickPickItem {
    label: string;
    action: vscode.CodeAction;

    constructor(action: vscode.CodeAction) {
        this.label = action.title;
        this.action = action;
    }

    /** Execute the quick action */
    async execute() {
        if (this.action.edit) {
            await vscode.workspace.applyEdit(this.action.edit);
        }

        const command = this.action.command;
        if (command) {
            const args: any[] = command.arguments ?? [];
            await vscode.commands.executeCommand(command.command, ...args);
        }
    }
}