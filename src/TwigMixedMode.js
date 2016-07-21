/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define(function () {
    "use strict";

    var debug = false,

        rHtmlClosingTag = /^<\/([\w_:\.\-]*)/,
        rTwigElse = /\{%\s*else(?:if)?/,
        rStringStart = /^["']/,
        rTwigOpen = /\{[#%{]/,

        twigTagEnds = [],
        twigTagStarts = ["autoescape", "block", "for", "embed", "filter", "if", "spaceless", "with", "trans", "blocktrans", "macro", "verbatim", "sandbox"];

    twigTagStarts.forEach(function (tagName) {
        twigTagEnds.push("end" + tagName);
    });

    function log() {
        if (debug) {
            console.log.apply(console, arguments);
        }
    }

    function TwigMixedMode(options, htmlMixedMode, twigMode) {
        this.options = options;
        this.htmlMixedMode = htmlMixedMode;
        this.twigMode = twigMode;
    }

    TwigMixedMode.prototype = {
        options: null,

        htmlMixedMode: null,

        twigMode: null,

        handleConditionnalTwigBlock: function (tagName, state) {
            var conditionnalStrings = state.conditionnalStrings;

            if (tagName === "if") {
                conditionnalStrings.push(state.pendingString);
            } else if (tagName === "elseif" || tagName === "else") {
                if (state.getContextualTagName() === "if") {
                    state.pendingString = conditionnalStrings[conditionnalStrings.length - 1];
                }
            } else if (tagName === "endif") {
                state = conditionnalStrings.pop();
            }
        },

        handleTwigTag: function (stream, state, style) {
            if (style === "keyword") {
                var tagName = stream.current().trim();

                state.tagName = tagName;

                this.handleConditionnalTwigBlock(tagName, state);

                if (twigTagStarts.indexOf(tagName) > -1) {
                    state.pushContext();
                } else if (twigTagEnds.indexOf(tagName) > -1) {
                    if (state.canPopContext(tagName)) {
                        state.popContext();
                    } else {
                        style += " error";
                    }
                }
            }

            return style;
        },

        getStyle: function (stream, state) {
            var style = null;

            if (stream.sol()) {
                if (!state.tagName) {
                    state.indented = stream.indentation();
                } else if (state.pendingToken) {
                    state.pendingToken = null;
                    log("discard pending token early");
                }
            }

            if (state.inTwigMode()) {
                style = this.twigMode.token(stream, state.twigState);

                if (state.twigTagOpened) {
                    state.twigTagOpened = false;
                    style = this.handleTwigTag(stream, state, style);
                }

                if (style === "tag" || style === "comment") {
                    if (style === "tag" || !state.twigState.incomment) {
                        if (style === "tag") {
                            state.tagName = "";
                        }

                        state.currentMode = this.htmlMixedMode;
                        state.currentState = state.htmlMixedState;

                        log("switching to html mode");
                    }
                }
            } else {
                style = this.twigMode.token(stream, state.twigState);

                if (style === "tag" || style === "comment") {
                    if (style === "tag" || state.twigState.incomment) {
                        state.currentMode = this.twigMode;
                        state.currentState = state.twigState;

                        state.tagStart = stream.column();

                        if (style === "tag" && stream.current()[1] === "%") {
                            state.twigTagOpened = true;
                        }

                        log("switching to twig mode");
                    }
                } else {
                    stream.backUp(stream.current().length);

                    if (state.pendingString) {
                        while (!stream.eol()) {
                            if (stream.next() === state.pendingString) {
                                state.previousPendingString = state.pendingString;
                                state.pendingString = "";
                                break;
                            }
                        }

                        log("pending string: " + stream.current());

                        style = "string";
                    } else if (state.pendingToken && stream.pos < state.pendingToken.end) {
                        stream.pos = state.pendingToken.end;
                        style = state.pendingToken.style;

                        log("pending token: " + state.pendingToken.style);

                        state.pendingToken = null;
                    } else {
                        style = this.htmlMixedMode.token(stream, state.htmlMixedState);

                        if (style && style.split(" ")[0] === "tag") {
                            var htmlState = state.htmlMixedState.htmlState;

                            if (htmlState.tagName) {
                                htmlState.tagName = htmlState.tagName.replace(rTwigOpen, "");
                            }
                        }
                    }

                    var token = stream.current(),
                        twigOpening = token.search(rTwigOpen);

                    if (style && twigOpening > -1) {
                        var stringStart,
                            stringStartMatches;

                        if (style === "string" ) {
                            stringStartMatches = token.match(rStringStart);

                            if (stringStartMatches) {
                                stringStart = stringStartMatches[0];
                            } else {
                                stringStart = state.previousPendingString;
                            }
                        }

                        if (stringStart && token.match(new RegExp(stringStart + "$"))) {
                            state.pendingString = stringStart;
                        } else {
                            state.pendingToken = {
                                end: stream.pos,
                                style: style
                            };
                        }

                        stream.backUp(token.length - twigOpening);
                    }

                    state.previousPendingString = "";
                }
            }

            log(style, stream.current(), state.htmlMixedState.htmlState, state.twigState, state.pendingString, state.pendingToken, state.conditionnaStrings, state);

            return style;
        },

        getIndent: function (state, textAfter) {
            var indent,
                context = state.context,
                indentUnit = this.options.indentUnit;

            if (state.inTwigMode()) {
                indent = state.tagStart + indentUnit;
            } else if (!context || context.htmlContext !== state.getHtmlContext()) {
                indent = this.htmlMixedMode.indent(state.htmlMixedState, textAfter);
            } else {
                indent = context.indent + indentUnit;

                if (textAfter.match(rTwigElse) || textAfter.match(new RegExp("{%\\s+end" + context.tagName + "\\s+%}"))) {
                    indent -= indentUnit;
                }
            }

            return indent;
        }
    };

    return TwigMixedMode;
});
