import feedback from 'src/feedback';

describe('#feedback', () => {
  test('number', () => {
    expect(feedback(2)).toEqual({
      type: 'number',
      value: 2,
    });

    expect(feedback(0)).toEqual({
      type: 'number',
      value: 0,
    });

    expect(feedback(-0)).toEqual({
      type: 'number',
      value: -0,
    });

    expect(feedback(-0.0)).toEqual({
      type: 'number',
      value: -0.0,
    });

    expect(feedback(1.1)).toEqual({
      type: 'number',
      value: 1.1,
    });

    expect(feedback(1.0)).toEqual({
      type: 'number',
      value: 1.0,
    });

    expect(feedback(NaN)).toEqual({
      type: 'number',
      value: NaN,
    });
  });
});
