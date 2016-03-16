/*jslint indent: 4 */
/*global brackets, define */

define(function (require) {
    "use strict";

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        LanguageManager = brackets.getModule("language/LanguageManager"),

        utils = require("src/utils"),
        TwigMixedMode = require("src/TwigMixedMode"),
        TwigMixedState = require("src/TwigMixedState");

    utils.loadMode(["htmlmixed", "twig"]);

    // we define the mode and the language without waiting for htmlmixed and
    // twig to be loaded this create a race condition but if we wait then
    // all the file extensions for which twigmixed is define as default
    // language will see their default language switch to plain text
    CodeMirror.defineMode("twigmixed", function (options, parserConfig) {
        var htmlMixedMode = CodeMirror.getMode(options, "htmlmixed"),
            twigMode = CodeMirror.getMode(options, "twig"),

            mode = new TwigMixedMode(options, htmlMixedMode, twigMode);

        return {
            startState: function () {
                var state = new TwigMixedState(mode),
                    htmlMode = htmlMixedMode.innerMode(state.htmlMixedState).mode;

                if (!htmlMode.twigMixedPatched) {
                    utils.extendElectricInput(htmlMode, /\{%\s*\w+\s*%/);
                    htmlMode.twigMixedPatched = true;
                }

                return state;
            },

            copyState: function (state) {
                return state.clone();
            },

            token: function (stream, state) {
                return mode.getStyle(stream, state);
            },

            indent: function (state, textAfter) {
                return mode.getIndent(state, textAfter);
            },

            innerMode: function (state) {
                return state.getInnerMode();
            }
        };
    });

    LanguageManager.defineLanguage("twigmixed", {
        name: "Twig",
        mode: "twigmixed",
        fileExtensions: ["twig", "html.twig", "twig.html"]
    });
});
