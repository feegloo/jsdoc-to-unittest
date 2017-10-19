import escodegen from 'escodegen';
import doctrine from 'doctrine';
import * as acorn from 'acorn';
import * as walk from 'acorn/dist/walk';
import { stripSemicolons, stripComments, isPrimitive, validateSyntax } from './utils';
import { getPath } from './analyzer';

class Sample {
  constructor({
    tags,
  }) {
    this.tags = Sample.parseTags(tags, {
      async: [],
      returns: [{}],
      return: [{}],
      name: [{}],
      example: [],
      mock: [],
    });

    this.name = this.tags.name[0].name;
    this.examples = this.tags.example.map(this.parseExample, this);
  }

  get returns() {
    return (this.tags.returns[0] || this.tags.return[0]).type;
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

    if (this.tags.async.length > 0) {
      data.async = true;
    }

    try {
      acorn.parse(code, {
        onComment: comments,
      });

      const lineComments = comments.filter(({ type }) => type === 'Line');

      if (lineComments.length) {
        const { value: result } = lineComments[lineComments.length - 1];
        data.result = result;
        data.type = 'value';
        if (typeof result === 'string') {
          try {
            const type = Function(`return ${stripSemicolons(stripComments(result))}`)(); // fixme: sandbox me, please.
            data.type = isPrimitive(type) ? 'value' : 'equal';
            data.result = JSON.stringify(type);
          } catch (ex) {}
        }
      }
    } catch (ex) {}

    if ((data.type === 'default' || validateSyntax(data.result).ex !== null) && this.returns) {
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
