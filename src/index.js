const vscode = require("vscode");
const mysql = require("mysql2");
const { config } = require("./db.js");

/**
 * @param {vscode.ExtensionContext} context
 */

async function activate(context) {
  let apis = [];

  console.log("Extension Activated!");

  let disposable = vscode.commands.registerCommand(
    "api-tester.runTest",
    async function () {
      const conn = new mysql.createConnection(config);
      await conn.connect(function (err) {
        if (err) {
          console.log("Database Connection Failed. Error:");
          throw err;
        } else {
          console.log("Database Connection Established.");
        }
      });

      conn.query(
        "CREATE TABLE IF NOT EXISTS apis (id serial PRIMARY KEY, name VARCHAR(50), quantity INTEGER);",
        function (err, results, fields) {
          if (err) throw err;
          console.log("Created apis table.");
        }
      );

      conn.query("SELECT * FROM apis", (err, results, fields) => {
        if (err) throw err;
        console.log(results);
      });

      vscode.window.showInformationMessage("Running API Tester");

      await conn.end(function (err) {
        if (err) throw err;
        else console.log("Done.");
      });
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
