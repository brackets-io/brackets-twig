/*jslint plusplus: true, indent: 4 */
/*global brackets, define */

define(function (require) {
    "use strict";

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        LanguageManager = brackets.getModule("language/LanguageManager"),

        TwigMixedMode = require("src/TwigMixedMode"),
        TwigMixedState = require("src/TwigMixedState");

    function loadMode(mode, success) {
        var modes, i, length,
            paths = [];

        if (typeof mode === "string") {
            modes = [mode];
        } else {
            modes = mode;
        }

        for (i = 0, length = modes.length; i < length; ++i) {
            mode = modes[i];

            if (!CodeMirror.modes.hasOwnProperty(mode)) {
                paths.push("thirdparty/CodeMirror/mode/" + mode + "/" + mode);
            }
        }

        if (paths.length > 0) {
            brackets.libRequire(paths, success);
        } else {
            success();
        }
    }

    function getRegExpFlags(regexp) {
        var string = regexp.toString();
        return string.substr(string.lastIndexOf("/") + 1);
    }

    function combineRegExp(a, b) {
        var i, flags = (getRegExpFlags(a) + getRegExpFlags(b)).split("");

        flags.sort();

        for (i = flags.length; i > 0; --i) {
            if (flags[i - 1] === flags[i]) {
                flags.splice(i, 1);
            }
        }

        return new RegExp("(?:" + a.source + ")|(?:" + b.source + ")", flags.join(""));
    }

    function extendElectricInput(mode, electricInput) {
        mode.electricInput = combineRegExp(mode.electricInput, electricInput);
    }

    loadMode(["htmlmixed", "twig"], function () {
        CodeMirror.defineMode("twigmixed", function (options, parserConfig) {
            var htmlMixedMode = CodeMirror.getMode(options, "htmlmixed"),
                twigMode = CodeMirror.getMode(options, "twig"),

                mode = new TwigMixedMode(options, htmlMixedMode, twigMode);

            return {
                startState: function () {
                    var state = new TwigMixedState(mode),
                        htmlMode = htmlMixedMode.innerMode(state.htmlMixedState).mode;

                    if (!htmlMode.twigMixedPatched) {
                        extendElectricInput(htmlMode, /\{%\s*\w+\s*%/);
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
});
