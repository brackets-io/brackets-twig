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

(function (global, factory) {
    if (typeof exports === "object" && typeof module === "object") {
        module.exports = factory();
    } else if (typeof define === "function" && define.amd) {
        define(factory);
    } else {
        global.TwigMixedContext = factory();
    }
}(this, function () {
    "use strict";

    function TwigMixedContext(state, tagName) {
        this.htmlContext = state.getHtmlContext();
        this.previous = state.context;

        this.tagName = tagName;
        this.indent = state.indented;
    }

    TwigMixedContext.prototype = {
        htmlContext: null,

        previous: null,

        tagName: "",

        indent: 0,

        clone: function () {
            var context = Object.create(TwigMixedContext.prototype);

            context.htmlContext = this.htmlContext;
            context.previous = this.previous;

            context.tagName = this.tagName;
            context.indent = this.indent;

            return context;
        }
    };

    return TwigMixedContext;
}));
