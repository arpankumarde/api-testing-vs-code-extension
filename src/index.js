const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  console.log('Congratulations, your extension "api-tester" is now active!');

  let disposable = vscode.commands.registerCommand(
    "api-tester.helloWorld",
    function () {
      vscode.window.showInformationMessage("Hello World from API Tester!");
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
