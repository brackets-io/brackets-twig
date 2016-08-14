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

/* global brackets */

(function (global, factory) {
    if (typeof exports === "object" && typeof module === "object") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        global.TwigMixedUtils = factory();
    }
}(this, function () {
    "use strict";

    function loadModes(CodeMirror, codeMirrorRoot, modes, success) {
        var i, length, mode,
            paths = [];

        for (i = 0, length = modes.length; i < length; ++i) {
            mode = modes[i];

            if (!Object.prototype.hasOwnProperty.call(CodeMirror.modes, mode)) {
                if (codeMirrorRoot) {
                    paths.push(codeMirrorRoot + "/mode/" + mode + "/" + mode);
                } else {
                    paths.push(mode);
                }
            }
        }

        if (paths.length > 0) {
            if (typeof brackets === "object") {
                brackets.libRequire(paths, success);
            } else if (typeof exports === "object" && typeof module === "object") {
                while (paths.length > 0) {
                    require(paths.pop());
                }
            } else if (typeof define === "function" && define.amd) {
                require(paths, success);
            } else {
                throw new Error("mode(s) not loaded: " + paths.join(", "));
            }
        }

        if (paths.length === 0 && typeof success === "function") {
            success();
        }
    }

    function getRegExpFlags(regexp) {
        var string = regexp.toString(),
            flags = string.substr(string.lastIndexOf("/") + 1);

        return flags;
    }

    function combineRegExp(a, b) {
        var i,
            flags = (getRegExpFlags(a) + getRegExpFlags(b)).split("");

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
        loadModes: loadModes,

        extendElectricInput: extendElectricInput
    };
}));
