import feedback, { Types } from 'src/feedback';

describe('#feedback', () => {
  test('Types.Number', () => {
    [2, 0, -0, -0.0, 1.1, 1.0, NaN].forEach((value) => {
      expect(feedback(value)).toEqual(Types.Number);
    });
  });
});
