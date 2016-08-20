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

(function (globa, factory) {
    if (typeof exports === "object" && typeof module === "object") {
        module.exports = factory(require("./TwigMixedState"), require("./TwigMixedUtils"));
    } else if (typeof define === "function" && define.amd) {
        define(["./TwigMixedState", "./TwigMixedUtils"], factory);
    } else {
        global.TwigMixedMode = factory(global.TwigMixedState, global.TwigMixedUtils);
    }
}(this, function (TwigMixedState, TwigMixedUtils) {
    "use strict";

    var debug = false,

        rTwigElse = /\{%\s*else(?:if)?/,
        rStringStart = /^["']/,
        rTwigOpen = /\{[#%{]/,

        twigBlockEnds = [],
        twigBlockStarts = ["autoescape", "block", "for", "embed", "filter", "if", "spaceless", "with", "trans", "macro", "verbatim", "sandbox"];

    twigBlockStarts.forEach(function (tagName) {
        twigBlockEnds.push("end" + tagName);
    });

    /**
     *  call console.log if debug is enabled
     *  @returns {undefined}
     *  @see {@link https://developer.mozilla.org/fr/docs/Web/API/Console/log}
     */
    function log() {
        if (debug) {
            // eslint-disable-next-line no-undef, no-console
            console.log.apply(console, arguments);
        }
    }

    /**
     *  A CodeMirror mode used to highlight twig code inside html
     *  @class
     *
     *  @param {Object} options         CodeMirror options
     *  @param {Object} htmlMixedMode   CodeMirror mode used to parse HTML
     *  @param {Object} twigMode        CodeMirror mode used to parse Twig code
     */
    function TwigMixedMode(options, htmlMixedMode, twigMode) {
        this.options = options;
        this.htmlMixedMode = htmlMixedMode;
        this.twigMode = twigMode;
    }

    TwigMixedMode.prototype = {
        options: null,

        htmlMixedMode: null,

        twigMode: null,

        /**
         *  Handle Twig conditionnal blocks inside HTML attributes, CSS strings and JS strings
         *
         *  @param {string}         tagName The name of the current twig tag
         *  @param {TwigMixedState} state   The current state of the parser
         *
         *  @returns {undefined}
         */
        handleConditionnalTwigBlock: function (tagName, state) {
            var conditionnalStrings = state.conditionnalStrings;

            if (tagName === "if") {
                conditionnalStrings.push(state.pendingString);
            } else if (tagName === "elseif" || tagName === "else") {
                if (state.getContextualTagName() === "if") {
                    state.pendingString = conditionnalStrings[conditionnalStrings.length - 1];
                }
            } else if (tagName === "endif") {
                conditionnalStrings.pop();
            }
        },

        /**
         *  Push or pop twig blocks from context and update style in case of error
         *
         *  @param {StringStream}   stream  The stream encapsulating the current file
         *  @param {TwigMixedState} state   The current state of the parser
         *  @param {string}         style   The style of the current token
         *
         *  @returns {string} The current style after the context is
         */
        handleTwigTag: function (stream, state, style) {
            if (style === "keyword") {
                var tagName = stream.current().trim();

                state.tagName = tagName;

                this.handleConditionnalTwigBlock(tagName, state);

                if (twigBlockStarts.indexOf(tagName) > -1) {
                    state.pushContext();
                } else if (twigBlockEnds.indexOf(tagName) > -1) {
                    if (state.canPopContext(tagName)) {
                        state.popContext();
                    } else {
                        style += " error";
                    }
                }
            }

            return style;
        },

        /**
         *  Parse the current Twig token, update style and state accordingly
         *
         *  @param {StringStream}   stream  The stream encapsulating the current file
         *  @param {TwigMixedState} state   The current state of the parser
         *
         *  @returns {string}   The style of the current Twig token
         */
        getTwigStyle: function (stream, state) {
            var style = null;

            // if there is a pending keyword then
            // it will be our current token
            if (state.pendingKeyword) {
                stream.pos = state.pendingKeyword.end;
                style = state.pendingKeyword.style;

                state.pendingKeyword = null;
            } else {
                style = this.twigMode.token(stream, state.twigState);

                if (style === "keyword") {
                    // twig mode considers the space in front of keywords
                    // like a part of the keyword itself to prevent that
                    // we return the space first and then we set the
                    // pendingKeyword attribute, so the next time this
                    // method will be called this keyword will be returned
                    // as the current token instead of what's next

                    state.pendingKeyword = {
                        end: stream.pos,
                        style: style
                    };

                    stream.pos = stream.start + 1;
                    style = null;
                } else if (style === "variable" && stream.current() === " ") {
                    // twig mode treat almost all spaces as variables
                    // and we don't want that
                    style = null;
                }
            }

            // if we are at the start of a twig tag
            // we check if it's a twig block or not
            if (state.twigTagOpened && style) {
                state.twigTagOpened = false;
                style = this.handleTwigTag(stream, state, style);
            }

            // if we are at the end of a twig tag
            // we switch back to html mode
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

            return style;
        },

        /**
         *  Parse the current HTML token, update style and state accordingly
         *
         *  @param {StringStream}   stream  The stream encapsulating the current file
         *  @param {TwigMixedState} state   The current state of the parser
         *
         *  @returns {string}   The style of the current Twig token
         */
        getHtmlMixedStyle: function (stream, state) {
            var style = this.twigMode.token(stream, state.twigState);

            // We start by trying to detect if there is any beggining twig tag
            // if there is we switch to twig mode
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
                // If we didn't find a twig tag we cancel read characters
                stream.backUp(stream.current().length);

                if (state.pendingString) {
                    // If there is a pending string we handle it
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
                    // If there is a pending token we handle it
                    stream.pos = state.pendingToken.end;
                    style = state.pendingToken.style;

                    log("pending token: " + state.pendingToken.style);

                    state.pendingToken = null;
                } else {
                    // Else we call the html mode to retrieve a token
                    style = this.htmlMixedMode.token(stream, state.htmlMixedState);

                    if (style && style.split(" ")[0] === "tag") {
                        var htmlState = state.htmlMixedState.htmlState;

                        // if a twig tag starts at the end of a html tag without spaces
                        // then the html parser considers that the twig tag start is a
                        // part of the html tag and it shouldn't be the case
                        if (htmlState.tagName) {
                            htmlState.tagName = htmlState.tagName.replace(rTwigOpen, "");
                        }
                    }
                }

                var token = stream.current(),
                    twigOpening = token.search(rTwigOpen);

                // we get the current token and we look if there is
                // a twig tag starting inside that token
                if (style && twigOpening > -1) {
                    var stringStart,
                        stringStartMatches;

                    if (style === "string") {
                        stringStartMatches = token.match(rStringStart);

                        // we try to detect if we are in a string or
                        // if we are supposed to (twig conditionnal)
                        if (stringStartMatches) {
                            stringStart = stringStartMatches[0];
                        } else {
                            stringStart = state.previousPendingString;
                        }
                    }

                    // If we are in a string and this string seems to
                    // stop on the same line we set the pendingString
                    // attribute of the state.
                    // In the other case we set the pendingToken
                    if (stringStart && token.match(new RegExp(stringStart + "$"))) {
                        state.pendingString = stringStart;
                    } else {
                        state.pendingToken = {
                            end: stream.pos,
                            style: style
                        };
                    }

                    // we back up at the twig tag start
                    stream.backUp(token.length - twigOpening);
                }

                state.previousPendingString = "";
            }

            return style;
        },

        /**
         *  Parse the current token, update style and state accordingly
         *
         *  @param {StringStream}   stream  The stream encapsulating the current file
         *  @param {TwigMixedState} state   The current state of the parser
         *
         *  @returns {string}   The style of the current Twig token
         */
        getStyle: function (stream, state) {
            var style;

            if (stream.sol()) {
                if (!state.tagName) {
                    // we save the current indentation in the state
                    state.indented = stream.indentation();
                }

                // we cancel any pending token since we are
                // in a new line so html parser didn't change
                if (state.pendingToken) {
                    state.pendingToken = null;
                    log("discard pending token early");
                }
            }

            // we parse stream according to the current mode
            if (state.inTwigMode()) {
                style = this.getTwigStyle(stream, state);
            } else {
                style = this.getHtmlMixedStyle(stream, state);
            }

            // we log everything for debug purpose
            log(style, stream.current(), state.htmlMixedState.htmlState, state.twigState, state.pendingString, state.pendingToken, state.conditionnaStrings, state);

            return style;
        },

        /**
         *  Returns the number of spaces or tabs required to indent the current line
         *
         *  @param {TwigMixedState} state       The current state of the parser
         *  @param {string}         textAfter   The text after the indentation
         *
         *  @returns {number}   The number of spaces or tabs required to indent the current line
         */
        getIndent: function (state, textAfter) {
            var indent,
                context = state.context,
                indentUnit = this.options.indentUnit;

            if (state.inTwigMode()) {
                indent = state.tagStart + indentUnit;
            } else if (!context || context.htmlContext !== state.getHtmlContext()) {
                // if the last tag is a html one we let the html mode handle the indent
                indent = this.htmlMixedMode.indent(state.htmlMixedState, textAfter);
            } else {
                // we take the indent of the parent twig block and we add one indent unit
                indent = context.indent + indentUnit;

                // if we are on a line with a twig block end the remove one indent unit
                if (textAfter.match(rTwigElse) || textAfter.match(new RegExp("{%\\s+end" + context.tagName + "\\s+%}"))) {
                    indent -= indentUnit;
                }
            }

            return indent;
        }
    };

    /**
     *  Define the twigmixed mode
     *
     *  @param {Object} CodeMirror  The current instance of CodeMirror
     *
     *  @returns {undefined}
     */
    function defineMode(CodeMirror) {
        CodeMirror.defineMode("twigmixed", function (options) {
            var htmlMixedMode = CodeMirror.getMode(options, "htmlmixed"),
                twigMode = CodeMirror.getMode(options, "twig:inner"),

                mode = new TwigMixedMode(options, htmlMixedMode, twigMode);

            return {
                startState: function () {
                    var state = new TwigMixedState(CodeMirror, mode),
                        htmlMode = htmlMixedMode.innerMode(state.htmlMixedState).mode;

                    // if we didn't patched the electric input the we extend it to
                    // include ours
                    if (!htmlMode.twigMixedPatched) {
                        TwigMixedUtils.extendElectricInput(htmlMode, /\{%\s*\w+\s*%/);
                        htmlMode.twigMixedPatched = true;
                    }

                    return state;
                },

                copyState: function (state) {
                    return state.clone(CodeMirror);
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
    }

    /**
     *  Load mode dependencies and then define the twigmixed mode
     *  If no callback is provided then the mode is defined without
     *  waiting for dependencies to be loaded
     *
     *  @param {Object}     CodeMirror      The current instance of CodeMirror
     *  @param {string}     codeMirrorRoot  The path to the CodeMirror directory
     *  @param {Function=}  callback       A function to call after the mode is defined
     *  @returns {undefined}
     */
    TwigMixedMode.define = function (CodeMirror, codeMirrorRoot, callback) {
        var deps = ["htmlmixed", "twig"];

        if (typeof callback === "function") {
            TwigMixedUtils.loadModes(CodeMirror, codeMirrorRoot, deps, function () {
                defineMode(CodeMirror);
                callback();
            });
        } else {
            TwigMixedUtils.loadModes(CodeMirror, codeMirrorRoot, deps);
            defineMode(CodeMirror);
        }
    };

    return TwigMixedMode;
}));
