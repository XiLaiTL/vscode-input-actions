import * as vscode from 'vscode';
import { registerActions, registerEvent } from './actions';
import { registerCreateCommand, registerEncourageCommand } from './commands';
import { getConfig, onConfigChange } from './configuration';
import { InputBinding } from './model';


export function activate(context: vscode.ExtensionContext) {
	const languages = getConfig("activate.languages", ["agda", "lagda-md", "lagda-rst", "lagda-tex"]);
	const inputActions = getConfig("actions", [{ "input": "\n", "command": "agda-mode.load" }] as InputBinding[]);
	registerActions(languages, inputActions);
	onConfigChange(context, undefined, (config: { "activate": {"languages":string[]},"actions":InputBinding[]}) => {
		registerActions(config.activate.languages, config.actions);
	});
	registerEvent(context);
	registerCreateCommand(context);
	registerEncourageCommand(context);
}

export function deactivate() {}
