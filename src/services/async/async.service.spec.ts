import { Test, TestingModule } from '@nestjs/testing';
import { AsyncPatternService } from './async.service';

describe('AsyncService', () => {
  let service: AsyncPatternService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsyncPatternService],
    }).compile();

    service = module.get<AsyncPatternService>(AsyncPatternService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
