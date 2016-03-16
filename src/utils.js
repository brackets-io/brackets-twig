/*jslint plusplus: true, indent: 4 */
/*global define, brackets */

define(function (require) {
    "use strict";

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

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

    return {
        loadMode: loadMode,

        getRegExpFlags: getRegExpFlags,

        combineRegExp: combineRegExp,

        extendElectricInput: extendElectricInput
    };
});
