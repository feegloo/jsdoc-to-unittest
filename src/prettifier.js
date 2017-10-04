const format = require('prettier-eslint');

const options = {
  prettierOptions: {
    bracketSpacing: true,
  },
  fallbackPrettierOptions: {
    singleQuote: false,
  },
};

export default sourceCode => format({ ...options, text: sourceCode });
