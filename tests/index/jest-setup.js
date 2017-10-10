/* eslint-disable */
import * as contants from 'mocks/constants';
import { mock } from 'mocks/mock';
import 'fixtures/easy.core';

Object.assign(global, contants);
Object.assign(global, frosmo);
Object.assign(global, { mock });
