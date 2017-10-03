const acorn = require('acorn');
const walk = require('acorn/dist/walk');
const escodegen = require('escodegen');
const doctrine = require('doctrine');
const { toResult } = require('./utils');
const getPath = require('./analyzer');

function parseExample({ obj, description: code, returns }) {
  const comments = [];
  const data = {
    get name() { return this.obj; },
    set name(value) {
      obj.name = value; // eslint-disable-line no-param-reassign
      return true;
    },
    code,
    result: '',
  };

  try {
    const lines = code.split(/[\n]+/);
    const ast = acorn.parse(lines[lines.length - 1], {
      onComment: comments,
    });

    const commentedOutLines = lines
      .map(item => item.replace(/\/{2,}.*(?:\n|$)/, '').trim())
      .filter(item => item.trim().length);

    walk.simple(ast, {
      CallExpression(node) {
        data.name = node.callee.name;
      },
    });

    if (data.name === undefined || data.name === '') {
      try {
        data.name = getPath(code).pop();
      } catch (ex) {}
    }

    const lineComments = comments.filter(({ type }) => type === 'Line');

    if (lineComments.length) {
      data.result = toResult(lineComments[lineComments.length - 1].value.trim());

      try {
        data.result = JSON.parse(data.result);
        data.type = 'value';
      } catch (ex) {
        data.type = 'default';
      }
    } else {
      data.result = returns;
      data.type = 'instance';
    }

    if (commentedOutLines.length > 1) {
      data.code = commentedOutLines.join(';');
    } else {
      data.code = commentedOutLines.join('');
    }
  } catch (ex) {
    // doesn't need any sort of erorr handling, we return data anyway
  }

  return data;
}

exports.default = (code) => {
  const funcs = {};
  const comments = [];
  const parsed = [];

  const ast = acorn.parse(code, {
    ranges: true,
    onComment: comments,
  });

  walk.simple(ast, {
    FunctionDeclaration(node) {
      funcs[node.id.name] = escodegen.generate(node, { comment: false });
    },
  });

  comments
    .filter(({ type }) => type === 'Block')
    .forEach(({ value: comment }) => {
      try {
        parsed.push(doctrine.parse(comment, { unwrap: true }));
      } catch (ex) {
        // no need to handle it, let's continue
      }
    });


  return {
    exports: Object.values(funcs),
    imports: Object.keys(funcs),
    samples: parsed.map(({ tags }) => {
      const returns = tags.find(({ title }) => title === 'return');
      const obj = {
        name: (tags.find(({ title }) => title === 'name') || {}).name,
        member: tags.find(({ title }) => title === 'memberof'),
      };

      return {
        examples: tags
          .filter(({ title }) => title === 'example')
          .map(item => parseExample({ ...item, returns, obj })),
        ...obj,
      };
    }),
  };
};
