/**
 * class Renderer
 *
 * Generates HTML from parsed token stream. Each instance has independent
 * copy of rules. Those can be rewritten with ease. Also, you can add new
 * rules if you create plugin and adds new token types.
 **/
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

exports.default = Renderer;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assign = require('markdown-it/lib/common/utils').assign;
var unescapeAll = require('markdown-it/lib/common/utils').unescapeAll;
var escapeHtml = require('markdown-it/lib/common/utils').escapeHtml;

////////////////////////////////////////////////////////////////////////////////

var default_rules = {};

default_rules.code_inline = function (tokens, idx, options, env, slf) {
    var token = tokens[idx];

    return '<code' + slf.renderAttrs(token) + '>{' + (0, _stringify2.default)(tokens[idx].content) + '}</code>';
};

default_rules.code_block = function (tokens, idx, options, env, slf) {
    var token = tokens[idx];

    return '<pre' + slf.renderAttrs(token) + '><code>{' + (0, _stringify2.default)(tokens[idx].content) + '}</code></pre>\n';
};

default_rules.fence = function (tokens, idx, options, env, slf) {
    var token = tokens[idx],
        info = token.info ? unescapeAll(token.info).trim() : '';

    var langName = '',
        highlighted = void 0,
        i = void 0,
        tmpAttrs = void 0,
        tmpToken = void 0;

    if (info) {
        langName = info.split(/\s+/g)[0];
    }

    if (options.highlight) {
        highlighted = options.highlight(token.content, langName) || escapeHtml(token.content);
    } else {
        highlighted = escapeHtml(token.content);
    }

    if (highlighted.indexOf('<pre') === 0) {
        return highlighted + '\n';
    }

    // If language exists, inject class gently, without mudofying original
    // token. May be, one day we will add .clone() for token and simplify this
    // part, but now we prefer to keep things local.
    if (info) {
        i = token.attrIndex('class');
        tmpAttrs = token.attrs ? token.attrs.slice() : [];

        if (i < 0) {
            tmpAttrs.push(['className', options.langPrefix + langName]);
        } else {
            tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
        }

        // Fake token just to render attributes
        tmpToken = {
            attrs: tmpAttrs
        };

        return highlighted;
    }

    return '<pre><code' + slf.renderAttrs(token) + '>' + highlighted + '</code></pre>\n';
};

default_rules.image = function (tokens, idx, options, env, slf) {
    var token = tokens[idx];

    // "alt" attr MUST be set, even if empty. Because it's mandatory and
    // should be placed on proper position for tests.
    //
    // Replace content with actual value

    token.attrs[token.attrIndex('alt')][1] = slf.renderInlineAsText(token.children, options, env);

    return slf.renderToken(tokens, idx, options);
};

default_rules.hardbreak = function (tokens, idx, options /*, env */) {
    return '<br />\n';
};
default_rules.softbreak = function (tokens, idx, options /*, env */) {
    return '<br />';
};

default_rules.text = function (tokens, idx /*, options, env */) {
    return '{' + (0, _stringify2.default)(tokens[idx].content) + '}';
};

default_rules.html_block = function (tokens, idx /*, options, env */) {
    return tokens[idx].content;
};
default_rules.html_inline = function (tokens, idx /*, options, env */) {
    return tokens[idx].content;
};

/**
 * new Renderer()
 *
 * Creates new [[Renderer]] instance and fill [[Renderer#rules]] with defaults.
 **/
function Renderer() {

    /**
     * Renderer#rules -> Object
     *
     * Contains render rules for tokens. Can be updated and extended.
     *
     * ##### Example
     *
     * ```javascript
     * const md = require('markdown-it')();
     *
     * md.renderer.rules.strong_open  = function () { return '<b>'; };
     * md.renderer.rules.strong_close = function () { return '</b>'; };
     *
     * const result = md.renderInline(...);
     * ```
     *
     * Each rule is called as independed static function with fixed signature:
     *
     * ```javascript
     * function my_token_render(tokens, idx, options, env, renderer) {
    *   // ...
    *   return renderedHTML;
    * }
     * ```
     *
     * See [source
     * code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js)
     * for more details and examples.
     **/
    this.rules = assign({}, default_rules);
    this.imports = {
        'React, {Component as $MDComponent}': 'react'
    };
    this.prelude = {};
}

/**
 * Renderer.renderAttrs(token) -> String
 *
 * Render token attributes to string.
 **/
Renderer.prototype.renderAttrs = function renderAttrs(token) {
    var i = void 0,
        l = void 0,
        result = void 0;

    if (!token.attrs) {
        return '';
    }

    result = '';

    for (i = 0, l = token.attrs.length; i < l; i++) {
        var name = token.attrs[i][0];
        switch (name) {
            case 'class':
                name = 'className';
                break;
            case 'for':
                name = 'htmlFor';
                break;
        }
        result += ' ' + escapeHtml(name) + '="' + escapeHtml(token.attrs[i][1]) + '"';
    }

    return result;
};

/**
 * Renderer.renderToken(tokens, idx, options) -> String
 * - tokens (Array): list of tokens
 * - idx (Numbed): token index to render
 * - options (Object): params of parser instance
 *
 * Default token renderer. Can be overriden by custom function
 * in [[Renderer#rules]].
 **/
Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
    var nextToken = void 0,
        result = '',
        needLf = false,
        token = tokens[idx];

    // Tight list paragraphs
    if (token.hidden) {
        return '';
    }

    // Insert a newline between hidden paragraph and subsequent opening
    // block-level tag.
    //
    // For example, here we should insert a newline before blockquote:
    //  - a
    //    >
    //
    if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
        result += '\n';
    }

    // Add token name, e.g. `<img`
    result += (token.nesting === -1 ? '</' : '<') + token.tag;

    // Encode attributes, e.g. `<img src="foo"`
    result += this.renderAttrs(token);

    // Add a slash for self-closing tags, e.g. `<img src="foo" /`
    if (token.nesting === 0 && options.xhtmlOut) {
        result += ' /';
    }

    // Check if we need to add a newline after this tag
    if (token.block) {
        needLf = true;

        if (token.nesting === 1) {
            if (idx + 1 < tokens.length) {
                nextToken = tokens[idx + 1];

                if (nextToken.type === 'inline' || nextToken.hidden) {
                    // Block-level tag containing an inline tag.
                    //
                    needLf = false;
                } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
                    // Opening tag + closing tag of the same type. E.g.
                    // `<li></li>`.
                    needLf = false;
                }
            }
        }
    }

    result += needLf ? '>\n' : '>';

    return result;
};

/**
 * Renderer.renderInline(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * The same as [[Renderer.render]], but for single token of `inline` type.
 **/
Renderer.prototype.renderInline = function (tokens, options, env) {
    var type = void 0,
        result = '',
        rules = this.rules;

    for (var i = 0, len = tokens.length; i < len; i++) {
        type = tokens[i].type;

        if (typeof rules[type] !== 'undefined') {
            result += rules[type](tokens, i, options, env, this);
        } else {
            result += this.renderToken(tokens, i, options);
        }
    }

    return result;
};

/** internal
 * Renderer.renderInlineAsText(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Special kludge for image `alt` attributes to conform CommonMark spec.
 * Don't try to use it! Spec requires to show `alt` content with stripped
 * markup, instead of simple escaping.
 **/
Renderer.prototype.renderInlineAsText = function (tokens, options, env) {
    var result = '';

    for (var i = 0, len = tokens.length; i < len; i++) {
        if (tokens[i].type === 'text') {
            result += tokens[i].content;
        } else if (tokens[i].type === 'image') {
            result += this.renderInlineAsText(tokens[i].children, options, env);
        }
    }

    return result;
};

/**
 * Renderer.render(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Takes token stream and generates HTML. Probably, you will never need to call
 * this method directly.
 **/
Renderer.prototype.render = function (tokens, options, env) {
    var i = void 0,
        len = void 0,
        type = void 0,
        result = '',
        rules = this.rules;

    for (i = 0, len = tokens.length; i < len; i++) {
        type = tokens[i].type;

        if (type === 'inline') {
            result += this.renderInline(tokens[i].children, options, env);
        } else if (typeof rules[type] !== 'undefined') {
            result += rules[tokens[i].type](tokens, i, options, env, this);
        } else {
            result += this.renderToken(tokens, i, options, env);
        }
    }

    return '\n' + (0, _keys2.default)(this.imports).map(renderImport, this.imports).join(';\n') + '\n' + (0, _keys2.default)(this.prelude).map(renderPrelude, this.prelude).join('') + '\n//autogenerated class\nexport default class Markdown extends $MDComponent {\n\n        render(){\n          return (<div>' + result + '</div>);\n        }\n}';
};

function renderPrelude(key) {
    var value = this[key];
    if (!value) {
        return '';
    }
    return key;
}

function renderImport(key) {
    var value = this[key];

    return 'import ' + key + ' from \'' + value + '\'';
}
//# sourceMappingURL=markdown.js.map