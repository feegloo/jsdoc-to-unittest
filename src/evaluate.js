import { getFunctionBody } from './utils';

export default (src, _eval) => _eval(getFunctionBody(src));

