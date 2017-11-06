import mock from 'src/mock';
import evaluate from 'src/evaluate';
import './matchers/jest';

global.evaluate = evaluate;
global.mock = mock;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
