/* global requirejs, test, runTests, callPhantom */

requirejs.config({
    paths: {
        codemirror: "../node_modules/codemirror"
    }
});

require([
    "codemirror/lib/codemirror",
    "../main",
    "spec"
], function (CodeMirror, TwigMixedMode, spec) {
    window.CodeMirror = CodeMirror;

    require(["codemirror/test/driver"]);
    require(["codemirror/test/mode_test"]);

    TwigMixedMode.define(CodeMirror, "codemirror", function () {
        var testName,
            twig = CodeMirror.getMode({ indentUnit: 4 }, "twigmixed");

        for (testName in spec) {
            if (Object.prototype.hasOwnProperty.call(spec, testName)) {
                test.mode(testName, twig, spec[testName]);
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

        runTests(function (status, name, message) {
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
