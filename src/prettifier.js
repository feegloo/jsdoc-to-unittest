const format = require('prettier-eslint');

export default sourceCode => format({ text: sourceCode });
