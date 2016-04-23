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
        twigTagStarts = ["autoescape", "block", "for", "embed", "filter", "if", "spaceless", "with", "trans", "blocktrans", "macro", "verbatim"];

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

        detectTwigBlock: function (stream, state, style) {
            if (style === "keyword") {
                var tagName = stream.current().trim(),
                    twigBlocks = state.twigBlocks;

                if (twigTagStarts.indexOf(tagName) > -1) {
                    var htmlContext = state.htmlMixedState.htmlState.context;

                    if (htmlContext && typeof htmlContext.twigBlockIndex === "number") {
                        htmlContext.twigBlockIndex = twigBlocks.length;
                    }

                    twigBlocks.push("end" + tagName);
                } else if (twigTagEnds.indexOf(tagName) > -1) {
                    if (twigBlocks[twigBlocks.length - 1] === tagName) {
                        twigBlocks.pop();
                    } else {
                        style += " error";
                    }
                }
            }

            return style;
        },

        getStyle: function (stream, state) {
            var style = null;

            if (stream.sol() && state.pendingToken) {
                state.pendingToken = null;
                log("discard pending token early");
            }

            if (state.inTwigMode()) {
                style = this.twigMode.token(stream, state.twigState);

                if (state.twigTagOpened) {
                    state.twigTagOpened = false;
                    style = this.detectTwigBlock(stream, state, style);
                }

                if (style === "tag" || style === "comment") {
                    if (style === "tag" || !state.twigState.incomment) {
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

                    if (twigOpening > -1) {
                        var stringStartMatches;

                        if (style === "string") {
                            stringStartMatches = token.match(rStringStart);
                        }

                        if (stringStartMatches && token.match(new RegExp(stringStartMatches[0] + "$"))) {
                            state.pendingString = stringStartMatches[0];
                        } else {
                            state.pendingToken = {
                                end: stream.pos,
                                style: style
                            };
                        }

                        stream.backUp(token.length - twigOpening);
                    }
                }
            }

            log(style, stream.current(), state.htmlMixedState.htmlState, state.twigState, state.pendingString, state.pendingToken, state.twigBlocks);

            return style;
        },

        getIndent: function (state, textAfter) {
            var indent = this.htmlMixedMode.indent(state.htmlMixedState, textAfter),
                indentUnit = this.options.indentUnit,
                twigBlocks = state.twigBlocks;

            if (state.htmlMixedState.localMode === null) {
                var htmlState = state.htmlMixedState.htmlState,
                    htmlContext = htmlState.context;

                if (textAfter.match(rHtmlClosingTag) && htmlContext && htmlContext.prev) {
                    htmlContext = htmlContext.prev;
                }

                if (!(htmlState.tokenize.isInAttribute || htmlState.tagName)) {
                    if (htmlContext && typeof htmlContext.twigBlockIndex === "number") {
                        indent += (twigBlocks.length - htmlContext.twigBlockIndex) * indentUnit;
                    } else {
                        indent += twigBlocks.length * indentUnit;
                    }
                }
            }

            if (textAfter.match(rTwigElse)) {
                indent -= indentUnit;
            } else if (textAfter.match(new RegExp("{%\\s+" + twigBlocks[twigBlocks.length - 1] + "\\s+%}"))) {
                indent -= indentUnit;
            }

            return indent;
        }
    };

    return TwigMixedMode;
});
