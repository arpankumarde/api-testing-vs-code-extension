const vscode = require("vscode");
const mysql = require("mysql2");
const axios = require("axios");
const { config } = require("./db.js");

/**
 * @param {vscode.ExtensionContext} context
 */

async function activate(context) {
  console.log("Extension Activated!");

  let disposable = vscode.commands.registerCommand(
    "api-tester.runTest",
    async function () {
      let apis = [];
      let apiResults = [];

      vscode.window.showInformationMessage("Running API Tester");

      // Create a connection to the database
      const conn = new mysql.createConnection(config);
      await conn.connect(function (err) {
        if (err) {
          console.log("Database Connection Failed. Error:");
          throw err;
        } else {
          console.log("Database Connection Established.");
        }
      });

      // Create apis table if it doesn't exist
      conn.query(
        "CREATE TABLE IF NOT EXISTS apis (id int NOT NULL AUTO_INCREMENT PRIMARY KEY, api_name varchar(255) NOT NULL, method varchar(10) NOT NULL, description text, endpoint varchar(255) NOT NULL, request_headers json DEFAULT NULL, request_body json DEFAULT NULL);",
        function (err, results, fields) {
          if (err) throw err;
          console.log("Table setup complete.");
        }
      );

      conn.query("SELECT * FROM apis", async (err, results, fields) => {
        if (err) throw err;
        apis = results;
        console.log(apis);
        for (let i = 0; i < apis.length; i++) {
          let api = apis[i];
          let status = await getStatus(api);
          // console.log(status);
          apiResults = [
            ...apiResults,
            { endpoint: api.endpoint, status: status },
          ];
        }
        console.log(apiResults);
      });

      await conn.end(function (err) {
        if (err) throw err;
        else console.log("Database Disconnected.");
      });
    }
  );

  context.subscriptions.push(disposable);
}

const getStatus = async (api) => {
  const { method, endpoint, request_headers, request_body } = api;
  const config = { headers: request_headers };

  // if (method === "GET") {
  //   await axios
  //     .get(endpoint, {
  //       headers: request_headers,
  //       data: request_body,
  //     })
  //     .then((response) => {
  //       console.log(response);
  //       return response.status;
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       return error.response.status;
  //     });
  // } else if (method === "POST") {
  //   axios
  //     .post(endpoint, request_body, {
  //       headers: request_headers,
  //     })
  //     .then((response) => {
  //       console.log(response);
  //       return response.status;
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       return error.response.status;
  //     });
  // } else if (method === "PUT") {
  //   axios
  //     .put(endpoint, request_body, {
  //       headers: request_headers,
  //     })
  //     .then((response) => {
  //       console.log(response);
  //       return response.status;
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       return error.response.status;
  //     });
  // } else if (method === "DELETE") {
  //   axios
  //     .delete(endpoint, {
  //       headers: request_headers,
  //       data: request_body,
  //     })
  //     .then((response) => {
  //       console.log(response);
  //       return response.status;
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       return error.response.status;
  //     });
  // } else {
  //   return "Invalid Method";
  // }
  let sts = 0;
  await axios({
    method: method,
    url: endpoint,
    // ...request_headers,
    data: request_body,
  })
    .then((response) => {
      // console.log(response.status);
      sts = response.status;
    })
    .catch((error) => {
      // console.error(error.response.status);
      sts = error.response.status;
    });

  return sts;
};

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
