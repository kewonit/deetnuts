'use strict';

const utils = require('./utils');
const checkDepth = require('./depth');

module.exports = (ast, options = {}) => {
  const stringify = (node, parent = {}, depth = 0) => {
    checkDepth(depth);
    const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
    const invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
        return '\\' + node.value;
      }
      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (const child of node.nodes) {
        output += stringify(child, undefined, child.nodes ? depth + 1 : depth);
      }
    }
    return output;
  };

  return stringify(ast);
};
