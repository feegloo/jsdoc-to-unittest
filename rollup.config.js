import babel from 'rollup-plugin-babel';

export default {
  input: './src/index.js',
  name: 'docs2tests',
  output: {
    format: 'cjs',
    file: './dist/bundle.js',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
      externalHelpers: false,
    }),
  ],
  acorn: {
    allowReserved: true,
    ecmaVersion: 8,
  },
};
