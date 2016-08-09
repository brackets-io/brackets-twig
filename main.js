/* global brackets */

(function (factory) {
    if (typeof exports === "object" && typeof module === "object") {
        module.exports = factory(require("./src/TwigMixedMode"));
    } else if (typeof define === "function" && define.amd) {
        define(["./src/TwigMixedMode"], factory);
    } else {
        factory(global.TwigMixedMode);
    }
}(function (TwigMixedMode) {
    "use strict";

    if (typeof brackets === "object") {
        var codeMirrorRoot = "thirdparty/CodeMirror",
            CodeMirror = brackets.getModule(codeMirrorRoot + "/lib/codemirror"),
            LanguageManager = brackets.getModule("language/LanguageManager");

        // we define the mode and the language without waiting for htmlmixed and
        // twig to be loaded this create a race condition but if we wait then
        // all the file extensions for which twigmixed is define as default
        // language will see their default language switch to plain text
        TwigMixedMode.define(CodeMirror, codeMirrorRoot);

        LanguageManager.defineLanguage("twigmixed", {
            name: "Twig",
            mode: "twigmixed",
            fileExtensions: ["html.twig", "twig.html"]
        })
        .done(function (twig) {
            twig._setLanguageForMode("twig:inner", twig);
        });
    }

    return TwigMixedMode;
}));
