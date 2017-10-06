import escodegen from 'escodegen';
import doctrine from 'doctrine';
import { toResult, stripComments } from './utils';
import { getPath, parseKey } from './analyzer';

const acorn = require('acorn');
const walk = require('acorn/dist/walk');

function getLines(code) {
  const lines = code.split(/[\n]+/);

  return {
    lines,
    commentedOut: lines
      .map(stripComments)
      .filter(item => item.trim().length),
  };
}

function parseExample({ obj, description: code, returns }) {
  const comments = [];
  const data = {
    get name() { return this.obj; },
    set name(value) {
      obj.name = value;
      return true;
    },
    code,
    result: '',
  };

  try {
    const { lines, commentedOutLines } = getLines(code);
    const ast = acorn.parse(lines[lines.length - 1], {
      onComment: comments,
    });

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
  } catch (ex) {}

  return data;
}

export default (code) => {
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
      } catch (ex) {}
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

      const examples = tags
        .filter(({ title }) => title === 'example')
        .map(item => parseExample({ ...item, returns, obj }));

      if (examples.length && obj.name === undefined) {
        try {
          obj.name = parseKey(examples[0].code).fullPath.pop();
        } catch (ex) {}
      }

      return {
        examples,
        ...obj,
      };
    }),
  };
};
