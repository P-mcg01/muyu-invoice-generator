const { pool, initDB } = require('../../src/services/db');
const { app, start } = require('../../src/web');

jest.mock('../../src/services/db', () => ({
  ...jest.requireActual('../../src/services/db'),
  initDB: jest.fn().mockResolvedValue(),
}));

describe('Lifecycle', () => {
  test('should handle start logic', async () => {
    const listenSpy = jest.spyOn(app, 'listen').mockImplementation((port, cb) => {
      cb();
      return { close: jest.fn() };
    });

    await start();

    expect(initDB).toHaveBeenCalled();
    expect(listenSpy).toHaveBeenCalled();
    listenSpy.mockRestore();
  });
});
