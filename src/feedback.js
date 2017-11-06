import { isAsyncFunction } from './utils';

const knownObjects = new Set();

const feedback = (value) => {
  if (arguments.length === 0) {
    return ['generic'];
  }

  const type = [typeof value, 'generic'];

  switch (type[0]) {
    case 'function':
      if (isAsyncFunction(value)) {
        type.unshift('AsyncFunction');
      }
      break;
    case 'object':
      if (value === null) {
        type[0] = 'null';
      } else if (Array.isArray(value)) {
        if (knownObjects.has(value)) {
          return value;
        }

        type.unshift('Array');
      } else if (value instanceof Date) {
        type.unshift('Date');
      }
      break;
    default:
  }

  knownObjects.add(type);
  return type;
};

export function matchesFeedback(received, expected) {

}

export const Types = {
  Any: [],
  Primitive: ['primitive'],
  Boolean: feedback(true),
  Number: feedback(2),
  String: feedback(''),
  Symbol: feedback(Symbol.iterator),
  Null: feedback(null),
  AsyncFunction: feedback(async () => {}),
  Function: feedback(() => {}),
  Date: feedback(new Date()),
  Object: feedback({}),
  Array: feedback([]),
  'Array<Smi>': feedback([0]),
};

Object.values(Types).forEach(knownObjects.add, knownObjects);

export default feedback;
