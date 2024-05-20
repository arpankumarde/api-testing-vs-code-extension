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
          apiResults = [
            ...apiResults,
            { endpoint: api.endpoint, status: status },
          ];
        }
        showResults(apiResults);
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
  const ak = await axios({
    method: method,
    url: endpoint,
    ...request_headers,
    data: request_body,
  })
    .then((response) => {
      // console.log(response.status);
      sts = response.status;
      // console.log(" ", ak);
    })
    .catch((error) => {
      // console.error(error.response.status);
      sts = error.response.status;
    });

  return sts;
};

const showResults = (apiResults) => {
  // display result in vscode webview
  const panel = vscode.window.createWebviewPanel(
    "apiTester",
    "API Tester",
    vscode.ViewColumn.One,
    {}
  );

  // console.log("API Results: ", apiResults);

  const statusAggregator = { 200: 0, 400: 0, 500: 0 };

  const sts100 = apiResults.filter(
    (api) => api.status >= 100 && api.status <= 199
  );
  const sts200 = apiResults.filter(
    (api) => api.status >= 200 && api.status <= 299
  );
  const sts300 = apiResults.filter(
    (api) => api.status >= 300 && api.status <= 399
  );
  const sts400 = apiResults.filter(
    (api) => api.status >= 400 && api.status <= 499
  );
  const sts500 = apiResults.filter(
    (api) => api.status >= 500 && api.status <= 599
  );

  statusAggregator[100] = sts100.length;
  statusAggregator[200] = sts200.length;
  statusAggregator[300] = sts300.length;
  statusAggregator[400] = sts400.length;
  statusAggregator[500] = sts500.length;

  panel.webview.html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>API Tester</title>
            <style>
              body {
                font-family: sans-serif;
              }

              a {
                text-decoration: none;
                color: #007fff;
                font-weight: bold;
              }

              a:hover {
                text-decoration: underline;
              }

              table {
                text-align: center;
              }

              tr:last-child td {
                border-bottom: 1px solid #808080;
              }

              th,
              td {
                padding: 0.3rem 0.8rem;
                border-left: 1px solid #808080;
                border-right: 1px solid #808080;
              }

              th {
                padding: 10px;
                border-top: 1px solid #808080;
                border-bottom: 1px solid #808080;
              }

              tr:last-child td {
                border-bottom: 1px solid #808080;
              }

              details {
                padding: 1rem 0;
              }

              h1 {
                font-size: 2rem;
              }
              
              h2,
              summary {
                font-size: 1.5rem;
                font-weight: bold;
                margin: 1rem 0;
              }

              hr {
                margin: 1rem 0;
              

              h2,
              summary {
                font-weight: bold;
              }
            </style>
        </head>
        <body>
            <h1>API Tester</h1>
            <hr />
            <h2>Result Overview</h2>
            <table>
              <tr>
                <th>Status Code</th>
                <th>Count</th>
                <th>Meaning</th>
              </tr>
              <tr>
                <td>100x</td>
                <td>${statusAggregator[100]}</td>
                <td>Informational responses</td>
              </tr>
              <tr>
                <td>200x</td>
                <td>${statusAggregator[200]}</td>
                <td>Successful responses</td>
              </tr>
              <tr>
                <td>300x</td>
                <td>${statusAggregator[300]}</td>
                <td>Redirects</td>
              </tr>
              <tr>
                <td>400x</td>
                <td>${statusAggregator[400]}</td>
                <td>Client errors</td>
              </tr>
              <tr>
                <td>500x</td>
                <td>${statusAggregator[500]}</td>
                <td>Server errors</td>
              </tr>
            </table>

            <details>
              <summary>Detailed Results</summary>
              <table>
                <tr>
                    <th>Endpoint</th>
                    <th>Status</th>
                </tr>
                ${apiResults
                  .map(
                    (api) =>
                      `<tr>
                  <td>${api.endpoint}</td>
                  <td>${api.status}</td>
                    </tr>`
                  )
                  .join("")}
              </table>
            </details>
            <hr />
            <footer>
                <p>Powered by <a href="https://growsoc.com" target="_blank">Growsoc Technologies</a></p>
            </footer>
        </body>
        </html>`;
};

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
