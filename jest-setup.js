import * as contants from 'mocks/constants';
import { mock } from 'mocks/mock';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
Object.assign(global, contants);
Object.assign(global, { mock });
