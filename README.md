# jsdoc-test-generator

Generate jest/karma compliant test suite from any valid JS source containing jsdoc annotations.

### Technology stack
| Tool            | Version          |
|-----------------|------------------|
| Acorn           | 5.1.2            |
| babel-cli       | 6.26.0           |
| ESLint          | 4.7.2            |
| Doctrine        | 2.0.0            |
| Escodegen       | 1.9.0            |
| Prettier-eslint | 8.2.0            |
| Jest            | 21.2.1           |

## Prerequisites

You will need the following things properly installed on your computer:
 * Node.js >=8.8.1
 * Yarn >=1.0

## Installation

* `yarn -g`

## Running / Development

* `docs-to-tests [<options>] <input-file> [<output-file>]`

### Running Linters

* `yarn lint`

### Running Tests

* `yarn test`

## Code style

We use Airbnb styleguide with minor changes suitable to this particular project, i.e. we allow usage of eval and generators.

## Browser support

No support, but the core of tool is ready to be within any modern browser.

## List of options

### Command line flags
```
-i, --input                 Input file (required)
-o, --output                Output (if absent, prints to stdout)
-t, --target [jest]         Either Jest or Karma
-g, --globals               Globals to be placed inside of /* global <globals> */
--intro                     Content to insert at top of bundle (inside wrapper)
--outro                     Content to insert at end of bundle (inside wrapper)
--banner                    Content to insert at top of bundle (outside wrapper)
--footer                    Content to insert at end of bundle (outside wrapper)
--partials
--eslint
--prettify
-c, --check
--ignore-invalid
```


### Configuration files

### Further Reading / Useful Links

http://usejsdoc.org/
