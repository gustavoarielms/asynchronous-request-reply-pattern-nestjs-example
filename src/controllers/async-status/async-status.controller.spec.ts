import { Test, TestingModule } from '@nestjs/testing';
import { AsyncStatusController } from './async-status.controller';

describe('AsyncStatusController', () => {
  let controller: AsyncStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsyncStatusController],
    }).compile();

    controller = module.get<AsyncStatusController>(AsyncStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
