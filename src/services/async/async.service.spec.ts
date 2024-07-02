import { Test, TestingModule } from '@nestjs/testing';
import { AsyncService } from './async.service';

describe('AsyncService', () => {
  let service: AsyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsyncService],
    }).compile();

    service = module.get<AsyncService>(AsyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
