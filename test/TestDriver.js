/* eslint-env browser */

require.config({
    shim: {
        "codemirror/test/driver": {
            deps: ["codemirror/lib/codemirror"],

            init: function (CodeMirror) {
                this.CodeMirror = CodeMirror;

                return {
                    test: this.test,
                    runTests: this.runTests
                };
            }
        },

        "codemirror/test/mode_test": ["codemirror/test/driver"]
    }
});

define(["codemirror/lib/codemirror", "codemirror/test/driver", "codemirror/test/mode_test"], function (CodeMirror, cmDriver) {
    "use strict";

    var inPhantomJs = typeof callPhantom === "function";

    function TestDriver() {
        // nothing to do
    }

    TestDriver.prototype = {
        element: null,

        callPhantom: function (data) {
            // eslint-disable-next-line no-undef
            callPhantom(data);
        },

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
