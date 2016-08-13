
require.config({
    paths: {
        codemirror: "../node_modules/codemirror"
    }
});

require(["codemirror/lib/codemirror", "../main", "TestDriver", "specs"], function (CodeMirror, TwigMixedMode, TestDriver, specs) {
    TwigMixedMode.define(CodeMirror, "codemirror", function () {
        new TestDriver().testMode("twigmixed", specs);
    });
});
