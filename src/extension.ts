// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fastglob from 'fast-glob';
import uripath from 'file-uri-to-path';
import path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log("Hello!");

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableCfgFunctionsGenerator = vscode.commands.registerCommand('cfgfunctions.generateCfgFunctions', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		const developerTag = vscode.workspace.getConfiguration().get('cfgfunctionsTag');

		console.log('Your tag is: ' + developerTag);

		vscode.window.showWarningMessage('Your tag is: ' + developerTag);

		if(developerTag === 'YOUR_TAG_HERE') {
			vscode.window.showErrorMessage('Your developer/project tag is not yet defined in extension settings! Please define it via VS Code -> Settings -> Extensions and try again.');
			// return;
		}

		// Define start of CfgFunctions.hpp
		const content = [
			"#ifdef DEBUG_ENABLED_FULL",
			"allowFunctionsRecompile = 1;",
			"allowFunctionsLog = 1;",
			"#endif",
			"",
			"class CfgFunctions",
			"{",
			"",
			"\tclass " + developerTag,
			"\t{",
			""
		];

		// Get all categories by looking at the folders
		const categories = await vscode.workspace.fs.readDirectory(vscode.workspace.workspaceFolders[0].uri).then((results) =>
		// Include folders only (and not files)
		results.filter((result) => result[1] === 2).map((filteredResult) => filteredResult[0])
		);

		// DEBUG
		console.log(categories);

		const categoriesUpperCase = categories.map(category => category.toUpperCase());

		// DEBUG
		console.log(categoriesUpperCase);

		// DEBUG
		console.log(content);

		var subfoldersFiles = "";
		const currentDirString = uripath(vscode.workspace.workspaceFolders[0].uri.toString());
		const currentDirUri = vscode.workspace.workspaceFolders[0].uri;

		console.log("currentDirString: " + currentDirString);

		categories.forEach (function (category) {
			console.log("");
			console.log("### CATEGORY ADDED: " + category);
			console.log("");
			content.push("\t\tclass " + category + "\t\t");

			const sqfFiles = fastglob.sync((category + "/**/*.sqf").replace(/\\/g, '/'), {cwd: currentDirString, globstar: true});

			console.log(sqfFiles);

			if (sqfFiles.length > 0) {
				sqfFiles.forEach(function(sqfFile) {
					const formattedClass = formatFunctionClass(vscode.Uri.file(sqfFile));
				});
			}

			/*
			sqfStream.on('data', function (chunk) {
				subfoldersFiles += chunk.toString();
				console.log("SQF file: " + chunk.toString());
			});

			sqfStream.on('end', function() {
				console.log("final output " + subfoldersFiles);
			});
			*/			

		});

	});

	context.subscriptions.push(disposableCfgFunctionsGenerator);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function formatFunctionClass(sqfFileURI: vscode.Uri) {
	const functionName = "";
	var functionPath = "";
	const subcategory = "";
	const subcategoryFolder = "";
	const returnValue = "";
	const sqfFileString = uripath(sqfFileURI.toString());

	if (sqfFileString.endsWith('.sqf')) {
		console.log(sqfFileString);

		functionPath = path.dirname(sqfFileString);
		while (functionPath.charAt(0) === '/') {
			functionPath = functionPath.substring(1);
		}

		console.log(functionPath);
		
		var functionPathSplit = functionPath.split("/");
		
		const depth = functionPathSplit.length;
		console.log(depth);

		if (sqfFileString.startsWith('fn_')) {
			functionPath = 
		}

	} else {
		vscode.window.showErrorMessage("Generic error! Something went wrong when generating CfgFunctions. Double check the contents of it.");
		return;
	}

}
