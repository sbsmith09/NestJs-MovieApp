describe('Sample Test Suite', () => {
  it('should perform a basic test', () => {
    const value = 2 + 2;
    expect(value).toBe(4);
  });

  it('should demonstrate async testing', async () => {
    const asyncFunction = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(42), 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe(42);
  });
});