/*jslint vars: true, nomen: true, indent: 4 */
/*global brackets, define */

define(function (require) {
    "use strict";

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        TwigMixedContext = require("src/TwigMixedContext");

    function TwigMixedState(twigMixedMode) {
        this._htmlMixedMode = twigMixedMode.htmlMixedMode;
        this._twigMode = twigMixedMode.twigMode;

        this.htmlMixedState = CodeMirror.startState(this._htmlMixedMode);
        this.twigState = CodeMirror.startState(this._twigMode);

        this.currentMode = this._htmlMixedMode;
        this.currentState = this.htmlMixedState;

        this.conditionnalStrings = [];
    }

    TwigMixedState.prototype = {
        indented: 0,

        tagName: "",

        tagStart: 0,

        context: null,

        _htmlMixedMode: null,

        _twigMode: null,

        htmlMixedState: null,

        twigState: null,

        currentMode: null,

        currentState: null,

        pendingToken: null,

        pendingString: "",

        previousPendingString: "",

        conditionnalStrings: null,

        twigTagOpened: false,

        inTwigMode: function () {
            return this.currentMode === this._twigMode;
        },

        clone: function () {
            var htmlMixedState = CodeMirror.copyState(this._htmlMixedMode, this.htmlMixedState),
                twigState = CodeMirror.copyState(this._twigMode, this.twigState),
                state = Object.create(TwigMixedState.prototype);

            state.indented = this.indented;

            state.tagName = this.tagName;
            state.tagStart = this.tagStart;

            state.context = this.context ? this.context.clone() : null;

            state._htmlMixedMode = this._htmlMixedMode;
            state._twigMode = this._twigMode;

            state.htmlMixedState = htmlMixedState;
            state.twigState = twigState;

            state.currentMode = this.currentMode;
            state.currentState = this.inTwigMode() ? twigState : htmlMixedState;

            state.pendingToken = this.pendingToken;

            state.pendingString = this.pendingString;
            state.previousPendingString = this.previousPendingString;
            state.conditionnalStrings = this.conditionnalStrings.slice(0);

            state.twigTagOpened = this.twigTagOpened;

            return state;
        },

        getInnerMode: function () {
            return {
                mode: this.currentMode,

                state: this.currentState
            };
        },

        getHtmlContext: function () {
            return this.htmlMixedState.htmlState.context;
        },

        pushContext: function () {
            var tagName = this.tagName,
                tagStart = this.tagStart;

            this.tagName = this.tagStart = null;
            this.context = new TwigMixedContext(this, tagName, tagStart === this.indented);
        },

        getContextualTagName: function () {
            if (this.context) {
                return this.context.tagName;
            }

            return "";
        },

        canPopContext: function (tagName) {
            return "end" + this.getContextualTagName() === tagName;
        },

        popContext: function () {
            this.context = this.context.previous;
        }
    };

    return TwigMixedState;
});
