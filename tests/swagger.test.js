import swagger from '../src/docs/swagger.js';

describe('swagger doc', () => {
  it('has openapi and paths', () => {
    expect(swagger.openapi).toBe('3.0.0');
    expect(swagger.paths['/api/audios']).toBeTruthy();
  });
});
