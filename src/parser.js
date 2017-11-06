import escodegen from 'escodegen';
import doctrine from 'doctrine';
import * as walk from 'acorn/dist/walk';
import {
  stripSemicolons,
  stripComments,
  isPrimitive,
  validateSyntax,
  getFunctionBody,
  getFunctionParams,
} from './utils';
import { acorn } from './cache';
import { getPath, getPathAsync } from './analyzer';

const mappedTags = new Proxy({
  return: 'returns',
}, {
  get(target, key) {
    if (key in target) {
      return target[key];
    }

    return key;
  },
});

class Sample {
  constructor({
    tags,
  }) {
    this.tags = Sample.parseTags(tags, {
      async: [],
      returns: [],
      name: [{}],
      example: [],
      mock: [],
    });

    this.name = this.tags.name[0].name;
    this.examples = Promise.all(this.tags.example.map(this.parseExample, this));
  }

  get returns() {
    if (!this.tags.returns.length) {
      return {};
    }

    return this.tags.returns[0].type;
  }

  static parseTags(tags, /* istanbul ignore next */ defaults = {}) {
    const group = {};
    tags.forEach((tag) => {
      const title = mappedTags[tag.title];
      group[title] = [...(group[title] || []), tag];
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

  get isAsync() {
    return this.tags.async.length > 0 || (
      this.returns && this.returns.type === 'NameExpression' && ['Promise', 'easy.Promise'].includes(this.returns.name)
    );
  }

  static parseResult({ value }) {
    try {
      value = Function(`return ${stripSemicolons(stripComments(value))}`)();
      if (!isPrimitive(value)) {
        return {
          type: 'equal',
          value: JSON.stringify(value),
        };
      }

      return {
        type: 'value',
        value: JSON.stringify(value),
      };
    } catch (ex) {
      return {
        type: 'value',
        value,
      };
    }
  }

  async parseExample({ description: code }, i) {
    if (this.name === undefined) {
      try {
        let path;
        if (this.isAsync) {
          path = (await getPathAsync(code)).pop();
        } else {
          path = getPath(code).pop();
        }

        if (path.length > 1) {
          for (let i = path.length - 1; i >= 0; i -= 1) {
            if (!['then', 'catch'].includes(path[i])) {
              this.name = path[i];
              break;
            }
          }
        } else {
          [this.name] = path;
        }
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

    let asyncFunction = 0;
    if (validateSyntax(code).ex !== null) {
      try {
        asyncFunction = Number(
          validateSyntax(
            getFunctionParams(code).join(','),
            getFunctionBody(code, false),
          ).ex === false)
        ;
      } catch (ex) {}
    }

    if (this.isAsync) {
      data.async = this.isAsync + asyncFunction;
    }

    try {
      const ast = acorn.parse(code, {
        onComment: comments,
        locations: true,
      });

      const consoleNode = walk.findNodeAt(ast, null, null, (nodeType, node) => {
        if (nodeType === 'CallExpression') {
          const { callee } = node;
          return callee.type === 'MemberExpression' &&
            callee.object.name === 'console' &&
            callee.object.property !== '';
        }
      });

      const lineComments = comments.filter(({ type }) => type === 'Line');
      if (lineComments.length) {
        const { value, type } = Sample.parseResult(lineComments[lineComments.length - 1]);
        data.type = type;
        data.result = value;

        if (consoleNode) {
          const comment = lineComments.find(
            ({ loc }) => consoleNode.node.loc.end.line === loc.start.line,
          );

          if (comment) {
            data.type = 'console';
            data.result = Sample.parseResult(comment).value;
          }
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
      } else if (this.returns.name) {
        data.result = [this.returns.name];
      } else {
        data.result = ['void'];
      }
    }

    if (data.result && data.result.length === 1 && data.result[0] === 'void') {
      data.type = 'no-throw';
      data.result = '';
    }

    return data;
  }
}

export default async (code, { extractFunctions = true } = {}) => {
  const funcs = {};
  const parsed = [];

  const ast = acorn.parse(code, {
    onComment(block, comment) {
      if (block) {
        try {
          parsed.push(doctrine.parse(comment, { unwrap: true, sloppy: true }));
        } catch (ex) {}
      }
    },
  });

  if (extractFunctions) {
    walk.simple(ast, {
      FunctionDeclaration(node) {
        funcs[node.id.name] = escodegen.generate(node, { comment: false });
      },
    });
  }

  return {
    exports: Object.values(funcs),
    imports: Object.keys(funcs),
    samples: await Promise.all(parsed.map(async (obj) => {
      const sample = new Sample(obj);
      return { ...sample, examples: await sample.examples };
    })),
  };
};
