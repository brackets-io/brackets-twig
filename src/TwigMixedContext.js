
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
