/*jslint vars: true, nomen: true, indent: 4 */
/*global brackets, define */

define(function () {
    "use strict";

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    function TwigMixedState(twigMixedMode) {
        this._htmlMixedMode = twigMixedMode.htmlMixedMode;
        this._twigMode = twigMixedMode.twigMode;

        this.htmlMixedState = CodeMirror.startState(this._htmlMixedMode);
        this.twigState = CodeMirror.startState(this._twigMode);

        this.currentMode = this._htmlMixedMode;
        this.currentState = this.htmlMixedState;

        this.twigBlocks = [];
    }

    TwigMixedState.prototype = {
        _htmlMixedMode: null,

        _twigMode: null,

        htmlMixedState: null,

        twigState: null,

        currentMode: null,

        currentState: null,

        pendingString: '',

        pendingToken: null,

        twigTagOpened: false,

        twigBlocks: null,

        inTwigMode: function () {
            return this.currentMode === this._twigMode;
        },

        clone: function () {
            var htmlMixedState = CodeMirror.copyState(this._htmlMixedMode, this.htmlMixedState),
                twigState = CodeMirror.copyState(this._twigMode, this.twigState),
                state = Object.create(TwigMixedState.prototype);

            state._htmlMixedMode = this._htmlMixedMode;
            state._twigMode = this._twigMode;

            state.htmlMixedState = htmlMixedState;
            state.twigState = twigState;

            state.currentMode = this.currentMode;
            state.currentState = this.inTwigMode() ? twigState : htmlMixedState;

            state.pendingString = this.pendingString;
            state.pendingToken = this.pendingToken;

            state.twigTagOpened = this.twigTagOpened;
            state.twigBlocks = this.twigBlocks.slice(0);

            return state;
        },

        getInnerMode: function () {
            return {
                mode: this.currentMode,

                state: this.currentState
            };
        }
    };

    return TwigMixedState;
});
