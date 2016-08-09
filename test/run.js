/* eslint-env node */
/* eslint-disable no-console, no-process-exit */

const nodeStatic = require("node-static"),
    http = require("http");

var server,
    files = new nodeStatic.Server();

server = http.createServer(function (request, response) {
    request.addListener("end", function () {
        files.serve(request, response, function (error) {
            if (error) {
                console.log(error);
                process.exit(1);
            }
        });
    }).resume();
});

server.listen(8080, function () {
    const pathJoin = require("path").join,
        spawn = require("child_process").spawn,
        phantomJsPath = require("phantomjs-prebuilt").path;

    var args = [pathJoin(__dirname, "phantom.js")],
        phantom = spawn(phantomJsPath, args),
        failed = false;

    phantom.stdout.on("data", function (data) {
        console.log(data.toString());
    });

    phantom.stderr.on("data", function (data) {
        failed = true;
        console.log(data.toString());
    });

    phantom.on("close", function (code) {
        server.close();
        process.exit(code || failed ? 1 : 0);
    });
});
