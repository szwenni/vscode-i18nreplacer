import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const outputFile = 'deMod.json';

export function activate(context: vscode.ExtensionContext) {
    
    let cutInsert = (inJsText:boolean, isHTMLText: boolean) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            let text = document.getText(selection);

            // If the selected text starts and ends with quotation marks, remove them
            if ((text.startsWith(`"`) && text.endsWith(`"`)) ||
                (text.startsWith(`'`) && text.endsWith(`'`)) ||
                (text.startsWith('`') && text.endsWith('`'))) {
                text = text.substring(1, text.length - 1);
            }

            // Extract variables and replace them with {index}
            const variables: string[] = [];
            let variableStyle = '';
            const variablePatterns = [
                {pattern: /\$\{(.+?)\}/g, style: 'js'},
                {pattern: /'' \+ (.+?) \+ ''/g, style: 'js'},
                {pattern: /\{\{(.+?)\}\}/g, style: 'html'}
            ];

            variablePatterns.forEach(({pattern, style}) => {
                text = text.replace(pattern, (_match, g1) => {
                    if (!variableStyle) variableStyle = style;
                    variables.push(g1.trim());
                    return `{${variables.length - 1}}`;
                });
            });

            const relativeFilePath = vscode.workspace.asRelativePath(document.uri);
            const filePathWithoutExtension = relativeFilePath.replace(/\.[^/.]+$/, ""); // Remove the file extension
            const jsonKeyBase = filePathWithoutExtension.replace(/\//g, '_');
            
            const jsonFilePath = path.join(vscode.workspace.rootPath || '', 'i18n', 'lang', 'de.json');
            const jsonFilePathOut = path.join(vscode.workspace.rootPath || '', 'i18n', 'lang', outputFile);
            
            const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8') || '{}');
            const jsonDataOut = JSON.parse(fs.readFileSync(jsonFilePathOut, 'utf-8') || '{}');

            let index = 0;
            while (jsonData[jsonKeyBase + '_' + index] || jsonDataOut[jsonKeyBase + '_' + index] || jsonData[jsonKeyBase + '__' + index] || jsonDataOut[jsonKeyBase + '__' + index]) {
                index++;
            }

            const jsonKey = jsonKeyBase + '_' + index;
            jsonDataOut[jsonKey] = text;

            fs.writeFileSync(jsonFilePathOut, JSON.stringify(jsonDataOut, null, 4));

            let replacementText = `t('${jsonKey}')`;
            if (variableStyle === 'html' || isHTMLText) {
                
                replacementText = `{{ $t('${jsonKey}') }}`;

            } else if(inJsText) {
                replacementText = `\${t('${jsonKey}')}`;
            }
            if (variables.length > 0) {
                if (variableStyle === 'html') {
                    replacementText = `{{ $t('${jsonKey}', [${variables.join(', ')}]) }}`;
                } else if (variableStyle === 'js') {
                    if(inJsText) {
                        replacementText = `\${t('${jsonKey}', [${variables.join(', ')}])}`;
                    } else {
                        replacementText = `t('${jsonKey}', [${variables.join(', ')}])`;
                    }
                }
            }
            

            editor.edit((editBuilder) => {
                editBuilder.replace(selection, replacementText);
            });
        }
    };
    let disposable = vscode.commands.registerCommand('i18nreplacer.cutAndInsert', () => cutInsert(false, false));
    let disposableInText = vscode.commands.registerCommand('i18nreplacer.cutAndInsertInText', () => cutInsert(true, false));
    let disposableInHtml = vscode.commands.registerCommand('i18nreplacer.cutAndInsertInHtml', () => cutInsert(false, true));
    let combineKeysDisposable = vscode.commands.registerCommand('i18nreplacer.combineKeys', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);

            const matches = text.match(/{{ \$t\('(.+?)'\) }}/g);
            if (matches) {
                const keys = matches.map(match => {
                    const curMatch = match.match(/'(.+?)'/);
                    if(curMatch) {
                        return curMatch[1];
                    }
                    return '';
                }).filter(x => x);
                const jsonFilePath = path.join(vscode.workspace.rootPath || '', 'i18n', 'lang', 'de.json');
                const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8') || '{}');
                
                let combinedValue = '';
                keys.forEach((key, index) => {
                    if (jsonData[key]) {
                        combinedValue += jsonData[key] + (index < keys.length - 1 ? ' ' : '');
                        if (index > 0) delete jsonData[key]; // Delete all keys except the first one
                    }
                });

                jsonData[keys[0]] = combinedValue; // Write the combined value back to the first key

                fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 4));

                editor.edit((editBuilder) => {
                    editBuilder.replace(selection, `{{ $t('${keys[0]}') }}`);
                });

                vscode.window.showInformationMessage('Keys combined successfully!');
            } else {
                vscode.window.showErrorMessage('No valid keys found in the selected text.');
            }
        }
    });

    let updateKeyDisposable = vscode.commands.registerCommand('i18nreplacer.updateKey', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);

            const match = text.match(/\$?t\('([^']+)',?\s*\[?(.*?)\]?\)/);
            if (match) {
                const key = match[1];
                const relativeFilePath = vscode.workspace.asRelativePath(document.uri);
                const filePathWithoutExtension = relativeFilePath.replace(/\.[^/.]+$/, ""); // Remove the file extension
                const jsonKeyBase = filePathWithoutExtension.replace(/\//g, '_');

                const jsonFilePath = path.join(vscode.workspace.rootPath || '', 'i18n', 'lang', 'de.json');
                const jsonFilePathOut = path.join(vscode.workspace.rootPath || '', 'i18n', 'lang', outputFile);
                const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8') || '{}');
                const jsonDataOut = JSON.parse(fs.readFileSync(jsonFilePathOut, 'utf-8') || '{}');
                if (jsonData[key]) {
                    let index = 0;
                    while (jsonDataOut[jsonKeyBase + '_' + index] || jsonDataOut[jsonKeyBase + '_' + index]) {
                        index++;
                    }

                    const newKey = jsonKeyBase + '_' + index;
                    jsonDataOut[newKey] = jsonData[key];

                    fs.writeFileSync(jsonFilePathOut, JSON.stringify(jsonDataOut, null, 4));
                    
                    editor.edit((editBuilder) => {
                        editBuilder.replace(selection, text.replace(key, newKey));
                    });

                    vscode.window.showInformationMessage('Key updated successfully!');
                } else {
                    vscode.window.showErrorMessage('Key not found in the JSON file.');
                }
            } else {
                vscode.window.showErrorMessage('Selected text does not match the expected pattern.');
            }
        }
    });

    context.subscriptions.push(disposable, updateKeyDisposable, disposableInText, combineKeysDisposable, disposableInHtml);
}

export function deactivate() {}
