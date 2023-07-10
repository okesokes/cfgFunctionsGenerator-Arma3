// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fastglob from 'fast-glob';
import uripath from 'file-uri-to-path';
import path from 'path';
import fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log("Hello!");
	const outputChannel = vscode.window.createOutputChannel("Arma 3 CfgFunctions.hpp Generator");

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableCfgFunctionsGenerator = vscode.commands.registerCommand('cfgfunctions.generateCfgFunctions', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
 
		let errors = false;
		
		outputChannel.clear();
		outputChannel.show();

		outputChannel.appendLine("###  ARMA 3 CFGFUNCTIONS GENERATOR  ###");
		outputChannel.appendLine("---");

		const developerTag = vscode.workspace.getConfiguration().get('cfgfunctionsTag');

		console.log('Your tag is: ' + developerTag);

		if(developerTag === 'YOUR_TAG_HERE') {
			vscode.window.showErrorMessage('Your developer/project tag is not yet defined in extension settings! Please define it via VS Code -> Settings -> Extensions and try again.');
			errors = true;
			// return;
		}

		outputChannel.appendLine("Starting to generate CfgFunctions.hpp.");
		outputChannel.appendLine("---");

		outputChannel.appendLine('Your developer/project tag is: ' + developerTag);
		outputChannel.appendLine("---");

		// Define start of CfgFunctions.hpp
		let content =
			"#ifdef DEBUG_ENABLED_FULL\n" +
			"allowFunctionsRecompile = 1;\n" +
			"allowFunctionsLog = 1;\n" +
			"#endif\n" +
			"\n" +
			"class CfgFunctions\n" +
			"{\n" +
			"\n" +
			"\tclass " + developerTag + "\n" +
			"\t{\n" +
			"\n";

		const currentFileString = vscode.window.activeTextEditor?.document.uri.fsPath.toString();

		const currentDirString = path.dirname(currentFileString);
		const currentDirUri = vscode.Uri.file(currentDirString);

		console.log("Current dir URI: " + currentDirUri);

		const filesOutsideOfFunctionsFolder = fastglob.sync(("*.sqf"), {cwd: currentDirString, globstar: true});

		if (filesOutsideOfFunctionsFolder.length > 0) {
			filesOutsideOfFunctionsFolder.forEach(function(fileOutside) {
				outputChannel.appendLine("File \"" + fileOutside + "\" didn't get included to CfgFunctions. It needs to be located in a subfolder of " + path.sep + "functions folder.");
			});
		};
		
		// Get all categories by looking at the folders
		const categories = await vscode.workspace.fs.readDirectory(currentDirUri).then((results) =>
		// Include folders only (and not files)
		results.filter((result) => result[1] === 2).map((filteredResult) => filteredResult[0])
		);

		// DEBUG
		console.log("CATEGORIES: " + categories);

		const categoriesUpperCase = categories.map(category => category.toUpperCase());

		// DEBUG
		console.log(categoriesUpperCase);

		// DEBUG
		console.log(content);

		console.log("currentDirString: " + currentDirString);

		let focusWarningShown = false;

		categories.forEach (function (category) {
			content = content + "\t\tclass " + category + "\n\t\t{\n\n";

			let sqfFiles = [""];

			try {
				sqfFiles = fastglob.sync((category + "/**/*.sqf"), {cwd: currentDirString, globstar: true});
			} catch (error) {
				vscode.window.showErrorMessage("Something went wrong! Make sure that you've clicked the editor area of your CfgFunctions.hpp before clicking the generate button.");
				outputChannel.appendLine("*** GENERIC ERROR ***")
				outputChannel.appendLine("Something went wrong! Make sure that you've clicked the editor area of your CfgFunctions.hpp before clicking the generate button.");
				outputChannel.appendLine("***");
				errors = true;
				return;
			};
			
			console.log(sqfFiles);

			if (sqfFiles.length > 0) {
				sqfFiles.forEach(function(sqfFile) {
					const formattedClass = formatFunctionClass(vscode.Uri.file(sqfFile), outputChannel);

					if (formattedClass !== "") {
						content = content + "\t\t\t" + formattedClass + "\n";
					}
				});
			} else {
				if (!focusWarningShown) {
					vscode.window.showErrorMessage("Something went wrong! Make sure that you've clicked the editor area of your CfgFunctions.hpp before clicking the generate button.");
					outputChannel.appendLine("GENERIC ERROR")
					outputChannel.appendLine("Something went wrong! Make sure that you've clicked the editor area of your CfgFunctions.hpp before clicking the generate button.");
					outputChannel.appendLine("---");
					focusWarningShown = true;
					errors = true;
					return;
				};
			};

			content = content + "\n\t\t};\n\n";

		});

		content = content + "\t};\n\n};\n\n";

		console.log(content);

		const outputCfgFunctions = "\n" + content;

		const currentEditor = vscode.window.activeTextEditor;

		if (currentEditor) {
			// let cfgFunctionsHpp = vscode.window.tabGroups.activeTabGroup.activeTab?.input.kind.uri;
			let cfgFunctionsHpp = currentEditor.document.uri.fsPath;
			fs.writeFileSync(cfgFunctionsHpp, outputCfgFunctions, 'utf8');
		};

		if (!errors) {
			outputChannel.appendLine("");
			outputChannel.appendLine("Generation of CfgFunctions.hpp finished.");
		};
		
	});

	context.subscriptions.push(disposableCfgFunctionsGenerator);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function formatFunctionClass(sqfFileURI: vscode.Uri, outputChannel: vscode.OutputChannel) {
	let functionName = "";
	let functionPath = "";
	let functionDirPath = "";
	let subcategory = "";
	let returnValue = "";
	let sqfFileString = uripath(sqfFileURI.toString());

	console.log("SQF FILE URI: " + sqfFileURI);

	sqfFileString = "functions" + sqfFileString;

	if (sqfFileString.endsWith('.sqf')) {
		console.log("SQF file string: " + sqfFileString);

		functionDirPath = path.dirname(sqfFileString);
		while (functionDirPath.charAt(0) === path.sep) {
			functionDirPath = functionDirPath.substring(1);
		}

		console.log("FunctionDirPath: " + functionDirPath);
		
		let functionDirPathSplit = functionDirPath.split(path.sep);
		
		const depth = functionDirPathSplit.length;
		console.log("Depth: " + depth);
		console.log("Function directory path split: " + functionDirPathSplit);

		let sqfFileStringSplit = sqfFileString.split(path.sep);
		console.log("SQF file string split: " + sqfFileStringSplit);
		let sqfFilename = sqfFileStringSplit.at(-1);

		if (sqfFilename === undefined) {
			vscode.window.showErrorMessage("Generic error!");
			outputChannel.appendLine("GENERIC ERROR");
		};

		console.log("SQF filename: " + sqfFilename);

		functionName = sqfFilename.replace(".sqf", "");

		if (sqfFilename.startsWith('fn_')) {

			let sqfFileStringTemp = sqfFileString;

			while (sqfFileStringTemp.charAt(0) === path.sep) {
				sqfFileStringTemp = sqfFileStringTemp.substring(1);
			}
			console.log("FUNCTION DIR PATH: " + sqfFileStringTemp);

			functionName = functionName.replace("fn_", "");
			console.log("Function name: " + functionName);

			functionPath = functionDirPath + path.sep + sqfFilename;

			if (depth > 2) {
				let functionDirPathSplitReversed = functionDirPathSplit.reverse();
				subcategory = functionDirPathSplitReversed[depth - (depth - (depth - 3))];
				console.log("Subcategory: " + subcategory);

				returnValue = nestedFolderFunctionName(subcategory, functionName, functionPath);
			}

			else if (depth === 2) {
				returnValue = coreFunctionName(functionName, functionPath);

			}
			
			else {
				outputChannel.appendLine("Function \"" + functionName + "\" didn't get included to CfgFunctions. It needs to be located in a subfolder of " + path.sep + "functions folder.");
			};

		} else {
			outputChannel.appendLine("File \"" + functionDirPath + path.sep + sqfFilename + "\" didn't get included to CfgFunctions: file name didn't start with 'fn_'.");
		};

	} else {
		vscode.window.showErrorMessage("Generic error! Something went wrong when generating CfgFunctions. Double check the contents of it.");
		outputChannel.appendLine("GENERIC ERROR! Something went wrong when generating CfgFunctions. Double check the contents of it.");
		return;
	}

	console.log("Return value: " + returnValue + "\n");
	return returnValue;
}

function nestedFolderFunctionName(subcategory: string, functionName: string, functionPath: string) {
	return "class " + subcategory + "_" + functionName + " { file = \"" + functionPath + "\"; };";
}

function coreFunctionName(functionName: string, functionDirPath: string) {
	return "class " + functionName + " { file = \"" + functionDirPath + "\"; };";
}

