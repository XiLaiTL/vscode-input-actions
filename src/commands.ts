import * as vscode from 'vscode';
import { CommandAction, InputBinding, RegexInput } from './model';
import { getConfig, saveConfig } from './configuration';
export function registerCreateCommand(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand("input-actions.create", async () => {
        await createActionChain();
    }));
}

export function registerEncourageCommand(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand("input-actions.encourage", async (information:string,withEncourage:boolean = true) => {
        vscode.window.showInformationMessage(`${withEncourage?"🎉":""}${information}`);
    }));
}


async function createActionChain() {
    const inputs: (string | RegexInput)[] = [];
    const commands: CommandAction[] = [];
    const languages: string[] = [];
    const breaks: string[] = [];

    while (breaks.length===0){
        await new Choice("Create Input Action")
            .on("Add Input Rule", async () => { 
                await new Choice("Input Content")
                    .on("Single Text", async () => {
                        const result = await Input("Single text as the input pattern");
                        if (result) {
                            inputs.push(result);
                        }
                    })
                    .on("Regex Test Rule", async () => { 
                        const regex = await Input("Regex rule as the input pattern");
                        if (!regex) {
                            vscode.window.showWarningMessage("At least one regex rule!");
                            return;
                        }
                        const length = await Input("The length of the input sentence");
                        if (!length) {
                            vscode.window.showWarningMessage("Length is NEEDED!");
                            return;
                        }
                        const lengthNumber = Number.parseInt(length);
                        if (Number.isNaN(lengthNumber)) {
                            vscode.window.showErrorMessage("Length is not a number!");
                            return;
                        }
                        inputs.push({ regex: regex, length: lengthNumber });
                    })
                    .on("Cancel", async () => {})
                    .show();
            })
            .on("Add Command Action", async () => {
                let command = await vscode.window.showQuickPick(
                    ["Input The Command Id Myself",
                        ...await vscode.commands.getCommands(true)
                    ], { title: "Choose the language id" });
                if (command === "Input The Command Id Myself") {
                    command = await Input("Input the command id");
                }
                if (!command) {
                    vscode.window.showWarningMessage("At least one command id!");
                    return;
                }

                let args = await Input("The args of the command. if args is string, it should be written as \"Hello World!\" with quotes");
                if (!args) {
                    commands.push({ command: command });
                }
                else {
                    try {
                        const argsObj = JSON.parse(args);
                        commands.push({ command: command, args: argsObj });
                    }
                    catch (e) {
                        vscode.window.showWarningMessage(JSON.stringify(e));
                    }
                }
            })
            .on("Add Activate Rule", async () => { 
                let result = await vscode.window.showQuickPick(["Input The Language Id Myself", ...await vscode.languages.getLanguages()], { title: "Choose the language id" });
                if (result === "Input The Language Id Myself") {
                    result = await Input("Input the language id");
                }
                if (result) {
                    languages.push(result);
                }
            })
            .on("Finish", async () => {
                if (inputs.length !== 0 && commands.length !== 0) {
                    breaks.push("break");
                    createNewAction(inputs, commands, languages);
                }
                if (inputs.length === 0) {
                    vscode.window.showWarningMessage("At least one input rule!");
                }
                if (commands.length === 0) {
                    vscode.window.showWarningMessage("At least one command action!");
                }
            })
            .on("Cancel", async () => {
                breaks.push("cancel");
            })
            .show();
    }
}

function createNewAction(
    inputs: (string | RegexInput)[],
    commands: CommandAction[],
    languages: string[]
) {
    const inputObject = inputs.length === 1 ? {
        "input": inputs[0]
    } : {
        "input": [...inputs],
    };
    const whenObject = languages.length === 0 ? {} : {
        "when": {
            "languages": [...languages]
        }
    };
    const commandObject = commands.length === 1 ? {
        ...commands[0]
    } : {
        "command": "runCommands",
        "args": {
            "commands": [...commands]
        }
    };
    const action: InputBinding = {
        ...commandObject,
        ...inputObject,
        ...whenObject
    };
    const inputActions = getConfig("actions", [{"input":"\n","command":"agda-mode.load"}] as InputBinding[]);
    inputActions.push(action);
    saveConfig("actions", inputActions);

    const activateLanguages = getConfig("activate.languages", ["agda", "lagda-md", "lagda-rst", "lagda-tex"]);
    saveConfig("activate.languages", [...new Set([...activateLanguages, ...languages])]);

    vscode.window.showInformationMessage("Finished. Check it!");
}


class Choice{
    constructor(private title: string) { };
    private action_map: { [selection: string]: () => Promise<void> } = {};
    on(selection:string,action:()=>Promise<void>):Choice {
        this.action_map[selection] = action;
        return this;
    }
    async show() {
        const item = await vscode.window.showQuickPick(Object.keys(this.action_map),{title:this.title});
        if (item) {
            await this.action_map[item]();
        }
    }
}

async function Input(title: string): Promise<string | undefined>{
    return await vscode.window.showInputBox({ title: title });
}

