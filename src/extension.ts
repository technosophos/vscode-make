'use strict';
import * as vscode from 'vscode';
import {spawn, execSync} from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const subscriptions = [
        vscode.commands.registerCommand('extension.runMake', runMake),
        vscode.commands.registerCommand('extension.runMakeByTarget', runMakeByTarget)
    ];

    subscriptions.forEach((sub) => {context.subscriptions.push(sub);});
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// Prompt user to enter a target, then run that target.
async function runMake() {
    const target = await vscode.window.showInputBox({
        prompt: "target"
    });
    if (target === undefined) {
        return;
    }

    // If there are not targets, we want targets to be empty, not an array with an empty string.
    let targets: string[] = [];
    target.split(" ").forEach((t) => {targets.push(t)});
    make(targets);
}

// Call make with a list of targets. An empty list runs the default.
function make(targets: string[]) {
    let resultMessage = "make is done";
    let make = spawn('make', targets, {
        cwd: vscode.workspace.rootPath
    });
    make.on("close", (code) => {
        if (code > 0) {
            resultMessage = "make failed";
            vscode.window.showErrorMessage(resultMessage);
        } else {
            vscode.window.showInformationMessage(resultMessage);
        }
    });

    let channel = getOutputChannel();
    make.stdout.on("data", (data: string) => {
        channel.appendLine(data.toString());
    });
    make.stderr.on("data", (data: string) => {
        channel.appendLine(data.toString());
    });

    channel.appendLine(resultMessage);
    channel.show(true);
}

// List the targets, and run the selected target
async function runMakeByTarget() {
    let targets = findMakeTargets();
    const target = await vscode.window.showQuickPick(targets);
    if (target !== undefined) {
        make([target]);
    }
}

// Get a list of targets
function findMakeTargets(): string[] {
    // This is approximately the Bash completion sequence run to get make targets.
    const bashCompletion = `make -pRrq : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($1 !~ "^[#.]") {print $1}}' | egrep -v '^[^[:alnum:]]' | sort | xargs`;
    let res = execSync(bashCompletion, {cwd: vscode.workspace.rootPath});
    return res.toString().split(" ");
}

let _channel: vscode.OutputChannel;
function getOutputChannel(): vscode.OutputChannel {
	if (!_channel) {
		_channel = vscode.window.createOutputChannel('Make');
	}
	return _channel;
}