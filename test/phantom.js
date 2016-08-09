/* eslint-env phantomjs */
/* eslint no-console: "off" */

const system = require("system");
const webPageCreate = require("webpage").create;

var page = webPageCreate();

page.onCallback = function (data) {
    var method = data && data.method;

    if (method === "outputTestResult") {
        var message = data.status + " " + data.name;

        if (data.status === "ok") {
            system.stdout.write(message);
        } else {
            system.stderr.write(message);
        }
    } else if (method === "exit") {
        phantom.exit(data.code || 0);
    }
};

page.onError = function (message, trace) {
    system.stderr.write(message + "\r\n\r\n  " + (trace[0].file || trace[0].sourceURL) + ":" + trace[0].line);
    phantom.exit(1);
};

page.open("http://localhost:8080/test/index.html");
