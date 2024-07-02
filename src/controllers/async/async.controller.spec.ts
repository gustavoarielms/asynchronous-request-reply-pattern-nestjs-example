import { Test, TestingModule } from '@nestjs/testing';
import { AsyncController } from './async.controller';

describe('AsyncController', () => {
  let controller: AsyncController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsyncController],
    }).compile();

    controller = module.get<AsyncController>(AsyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
