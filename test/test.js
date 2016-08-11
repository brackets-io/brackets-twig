
require.config({
    paths: {
        codemirror: "../node_modules/codemirror"
    }
});

require(["codemirror/lib/codemirror", "../main", "TestDriver", "specs"], function (CodeMirror, TwigMixedMode, TestDriver, specs) {
    TwigMixedMode.define(CodeMirror, "codemirror", function () {
        var driver = new TestDriver(),
            twig = CodeMirror.getMode({ indentUnit: 4 }, "twigmixed");

        driver.testMode(twig, specs);
    });
});
