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

/* eslint-env browser */

require.config({
    shim: {
        "codemirror-test/test/driver": {
            deps: ["codemirror/lib/codemirror"],

            init: function (CodeMirror) {
                this.CodeMirror = CodeMirror;

                return {
                    test: this.test,
                    runTests: this.runTests
                };
            }
        },

        "codemirror-test/test/mode_test": ["codemirror-test/test/driver"]
    }
});

define(["codemirror/lib/codemirror", "codemirror-test/test/driver", "codemirror-test/test/mode_test"], function (CodeMirror, cmDriver) {
    "use strict";

    var inPhantomJs = typeof callPhantom === "function";

    /**
     *  An utility class to test CodeMirror modes
     *  @class
     */
    function TestDriver() {
        // nothing to do
    }

    TestDriver.prototype = {
        element: null,

        /**
         *  Send data to phantom script
         *
         *  @param {Object} data the data to send
         *
         *  @returns {undefined}
         */
        callPhantom: function (data) {
            // eslint-disable-next-line no-undef
            callPhantom(data);
        },

        /**
         *  Output test results in a browser
         *
         *  @param {string}     status  The status of the test
         *  @param {string}     name    The name of the test
         *  @param {string=}    message Additionnal informations about the test
         *
         *  @returns {undefined}
         */
        outputResult: function (status, name, message) {
            if (inPhantomJs) {
                this.callPhantom({
                    method: "outputResult",
                    status: status,
                    name: name
                });
            } else {
                var html = status + " " + name;

                if (message) {
                    html += message;
                } else {
                    html += "<br />";
                }

                this.element.innerHTML += html;
            }
        },

        /**
         *  A default callback used by testMode
         *
         *  @see testMode
         *
         *  @param {string}     status  The status of the test
         *  @param {string}     name    The name of the test
         *  @param {string=}    message Additionnal informations about the test
         *
         *  @returns {undefined}
         */
        callback: function (status, name, message) {
            if (status === "done") {
                if (inPhantomJs) {
                    this.callPhantom({ method: "exit" });
                }
            } else {
                this.outputResult(status, name, message);
                window.quit = false;
            }
        },

        /**
         *  Test a CodeMirror mode and output results accordingly
         *
         *  @param {string|Object}  mode        The mode to test
         *  @param {Object}         specs       The specs to respect
         *  @param {Function=}      callback    The callback which is callback each time a test is completed
         *
         *  @returns {undefined}
         */
        testMode: function (mode, specs, callback) {
            var name,
                hasOwn = Object.prototype.hasOwnProperty;

            if (typeof mode === "string") {
                mode = CodeMirror.getMode({ indentUnit: 4 }, mode);
            }

            for (name in specs) {
                if (hasOwn.call(specs, name)) {
                    cmDriver.test.mode(name, mode, specs[name]);
                }
            }

            if (typeof callback !== "function") {
                callback = this.callback.bind(this);

                if (!inPhantomJs) {
                    this.element = document.createElement("div");
                    document.body.appendChild(this.element);
                }
            }

            cmDriver.runTests(callback);
        }
    };

    return TestDriver;
});
