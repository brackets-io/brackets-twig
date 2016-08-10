/* global requirejs, callPhantom */

requirejs.config({
    paths: {
        codemirror: "../node_modules/codemirror"
    },

    shim: {
        "codemirror/test/driver": {
            init: function () {
                return {
                    test: this.test,
                    runTests: this.runTests
                };
            }
        },

        "codemirror/test/mode_test": ["codemirror/test/driver"]
    }
});

require([
    "codemirror/lib/codemirror",
    "../main",
    "spec",
    "codemirror/test/driver",
    "codemirror/test/mode_test"
], function (CodeMirror, TwigMixedMode, spec, cmTestDriver) {
    window.CodeMirror = CodeMirror;

    TwigMixedMode.define(CodeMirror, "codemirror", function () {
        var testName,
            twig = CodeMirror.getMode({ indentUnit: 4 }, "twigmixed");

        for (testName in spec) {
            if (Object.prototype.hasOwnProperty.call(spec, testName)) {
                cmTestDriver.test.mode(testName, twig, spec[testName]);
            }
        }

        var output = document.getElementById("output");

        function outputTestResult(status, name, message) {
            if (typeof callPhantom === "function") {
                callPhantom({
                    method: "outputTestResult",
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

                output.innerHTML += html;
            }
        }

        cmTestDriver.runTests(function (status, name, message) {
            if (status === "done") {
                if (typeof callPhantom === "function") {
                    callPhantom({
                        method: "exit"
                    });
                }
            } else {
                outputTestResult(status, name, message);
                window.quit = false;
            }
        });
    });
});
