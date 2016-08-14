/**
 *  Copyright 2016 Athorcis
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/* eslint-env phantomjs */
/* eslint no-console: "off" */

const system = require("system");
const webPageCreate = require("webpage").create;

var page = webPageCreate();

page.onCallback = function (data) {
    var method = data && data.method;

    if (method === "outputResult") {
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
