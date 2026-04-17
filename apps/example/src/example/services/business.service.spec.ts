import * as fs from 'fs';
import { BusinessService } from './business.service';

describe('BusinessService', () => {
  let service: BusinessService;

  beforeEach(() => {
    service = new BusinessService();
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes the output file and returns a success message', async () => {
    await expect(
      service.save({
        name: 'job',
        milliseconds: 0,
      })
    ).resolves.toBe('Processed data: job');

    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('throws a simulated failure for fail scenario names', async () => {
    await expect(
      service.save({
        name: 'fail:job',
        milliseconds: 0,
      })
    ).rejects.toThrow('Simulated example failure for fail:job');

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});
