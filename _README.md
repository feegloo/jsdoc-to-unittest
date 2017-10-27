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
 * Node.js >=8.5.0
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
#include "command-line-flags.md"

### Configuration files

### Further Reading / Useful Links

http://usejsdoc.org/
