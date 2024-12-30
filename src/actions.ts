import * as vscode from 'vscode';
import { getConfig } from './configuration';
import { CommandAction, InputBinding } from './model';
import { regexOf } from './regex';

type ComposePredicateAction = () => Promise<void>;

const lang_actions: { [language: string]: InputBinding[] } = {};
const lang_predicates: { [language: string]: ComposePredicateAction[] } = {};
const lang_max_length: { [language: string]: number } = {};
const lang_words: { [language: string]: string[] } = {};
const lang_word_all: { [language: string]: string[] } = {};

export function clear() {
	const languages = Object.keys(lang_actions);
	for (const lang of languages) {
		delete lang_actions[lang];
		delete lang_predicates[lang];
		delete lang_max_length[lang];
		delete lang_words[lang];
		delete lang_word_all[lang];
	}
}

export function registerActions(languages:string[],inputActions:InputBinding[]) {
	for (const lang of languages) {
		lang_actions[lang] = []; 
		inputActions.filter(action => (!action.when) || action.when.languages.includes(lang))
			.forEach(action => lang_actions[lang].push(action));		
	}
	for (const lang of Object.keys(lang_actions)) {
		lang_max_length[lang] = 0;
		lang_words[lang] = [];
		lang_predicates[lang] = [];
		generatePredicates(lang);
	}
}


function generatePredicates(lang: string) {
	let max = lang_max_length[lang];
	for (const binding of lang_actions[lang]) {
		let predicate: () => boolean = ()=>false;
		if (typeof binding.input === 'string') {
			const input = binding.input;
			const length = input.length;
			max = Math.max(length, max);
			if (input.includes("\n")) {
				predicate = () => lang_word_all[lang][0].includes(input);
			}
			else {
				predicate = () => lang_word_all[lang][length].endsWith(input);
			}

		}
		// 检查input是否是RegexInput对象
		else if (typeof binding.input === 'object' && 'regex' in binding.input && 'length' in binding.input) {
			const length = binding.input.length;
			max = Math.max(length, max);
			const regex = regexOf(binding.input.regex);
			predicate = () => regex.test(lang_word_all[lang][length]);
		}
		// 检查input是否是数组
		else if (Array.isArray(binding.input)) {
			for (const item of binding.input) {
				if (typeof item === 'string') {
					const length = item.length;
					max = Math.max(length, max);
					const predicate_old = predicate;
					if (item.includes("\n")) { 
						predicate = () => lang_word_all[lang][0].includes(item) || predicate_old();
					}
					else {
						predicate = () => lang_word_all[lang][length].endsWith(item) || predicate_old();
					}
				} else if (typeof item === 'object' && 'regex' in item && 'length' in item) {
					const length = item.length;
					max = Math.max(length, max);
					const regex = regexOf(item.regex);
					const predicate_old = predicate;
					predicate = () =>  regex.test(lang_word_all[lang][length])  || predicate_old();
				}
			}
		}
		lang_predicates[lang].push(async () => {
			if (predicate()) {
				if (binding.args === undefined) {
					await vscode.commands.executeCommand(binding.command);
				} else {
					if (Array.isArray(binding.args)) {
						await vscode.commands.executeCommand(binding.command, ...binding.args);
					} else {
						await vscode.commands.executeCommand(binding.command, binding.args);
					}
				}
			}
		});
	}
	lang_max_length[lang] = max;

}

function updateWords(lang:string,newText:string) {
    //newText是空的时候意味着删除字符
    const newChars = newText.split('');
	for (const char of newChars) {
		if (lang_words[lang].length >= lang_max_length[lang]) {
			lang_words[lang].shift(); // 移除最旧的字符
		}
		lang_words[lang].push(char); // 添加新字符
	}
	lang_word_all[lang] = [newText];
	for (let i = 1; i <= lang_max_length[lang]; i++){
		const endChars = lang_words[lang].slice(-i);
		const endStr = endChars.join('');
		lang_word_all[lang].push(endStr);
	}
}



export function registerEvent(context: vscode.ExtensionContext){
	vscode.workspace.onDidChangeTextDocument(async (docEvent) => {
		const lang = docEvent.document.languageId;
		if (lang_predicates[lang]) {
            if (docEvent.contentChanges && docEvent.contentChanges.length > 0) {
                const newText = docEvent.contentChanges[0].text;
                if (newText) {
                    updateWords(lang, newText);
                    lang_predicates[lang].forEach(predicate => predicate());
                }
			}
		}

	}, null,context.subscriptions);
}

