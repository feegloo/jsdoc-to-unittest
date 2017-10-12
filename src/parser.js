import escodegen from 'escodegen';
import doctrine from 'doctrine';
import * as acorn from 'acorn';
import * as walk from 'acorn/dist/walk';
import { toResult, stripComments } from './utils';
import { getPath } from './analyzer';

function getLines(code) {
  const lines = code.split(/[\n]+/);

  return {
    lines,
    commentedOut: lines
      .map(stripComments)
      .filter(item => item.trim().length),
  };
}

class Sample {
  constructor({
    tags,
  }) {
    this.tags = Sample.parseTags(tags, {
      returns: [{}],
      name: [{}],
      example: [],
      mock: [],
    });

    this.name = this.tags.name[0].name;
    this.examples = this.tags.example.map(this.parseExample, this);
  }

  get returns() {
    return this.tags.returns[0].type;
  }

  static parseTags(tags, /* istanbul ignore next */ defaults = {}) {
    const group = {};
    tags.forEach((tag) => {
      group[tag.title] = [...(group[tag.title] || []), tag];
    });
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in group)) {
        group[key] = value;
      }
    }

    return group;
  }

  parseMocks(mock) {
    if (typeof mock === 'object') {
      try {
        return {
          mocks: Function(`return(${mock.description})`)(),
        };
      } catch (ex) {}
    }

    return {};
  }

  parseExample({ description: code }, i) {
    if (this.name === undefined) {
      try {
        this.name = getPath(code).pop().pop();
      } catch (ex) {}
    }

    const comments = [];
    const self = this;
    const data = {
      get name() { return self.name; },
      code,
      type: 'default',
      result: '',
      ...this.parseMocks(this.tags.mock[i]),
    };

    try {
      const { lines } = getLines(code);

      acorn.parse(lines[lines.length - 1], {
        onComment: comments,
      });

      const lineComments = comments.filter(({ type }) => type === 'Line');

      if (lineComments.length) {
        data.result = toResult(lineComments[lineComments.length - 1].value.trim());

        try {
          data.result = JSON.parse(data.result);
          data.type = 'value';
        } catch (ex) {}
      }

      // if (commentedOut.length > 1) {
      //   data.code = commentedOut.join(';');
      // } else {
      //   data.code = commentedOut.join('');
      // }
    } catch (ex) {}

    if (data.type === 'default' && this.returns) {
      data.type = 'instance';
      if (Array.isArray(this.returns.elements)) {
        data.result = this.returns.elements.map(({ type, name }) => {
          if (type === 'AllLiteral') {
            return '*';
          }

          return name;
        });
      } else {
        data.result = [this.returns.name];
      }
    }

    return data;
  }
}


export default (code) => {
  const funcs = {};
  const parsed = [];

  const ast = acorn.parse(code, {
    ranges: true,
    onComment(block, comment) {
      if (block) {
        try {
          parsed.push(doctrine.parse(comment, { unwrap: true }));
        } catch (ex) {}
      }
    },
  });

  walk.simple(ast, {
    FunctionDeclaration(node) {
      funcs[node.id.name] = escodegen.generate(node, { comment: false });
    },
  });

  return {
    exports: Object.values(funcs),
    imports: Object.keys(funcs),
    samples: parsed.map(obj => new Sample(obj)),
  };
};
