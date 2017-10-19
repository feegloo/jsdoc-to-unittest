import evaluate from 'src/evaluate';

let xyz = 30;
function abc() {
  return xyz;
}

describe('evaluate', () => {
  test('simple case', () => {
    expect(evaluate(
      () => {
        const arr = [10, 5, 3];
        arr[2];
      }, func => eval(func),
    )).toBe(3);
  });

  test('scope behaves as expected', () => {
    let test = 10;
    expect(evaluate(
      () => {
        test = 20;
        test;
      }, func => eval(func),
    )).toBe(20);

    expect(test).toBe(20);

    expect(evaluate(
      () => {
        abc();
      }, func => eval(func),
    )).toBe(30);
  });
});
