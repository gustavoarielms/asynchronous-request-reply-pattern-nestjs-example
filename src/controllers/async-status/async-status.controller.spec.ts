import { Test, TestingModule } from '@nestjs/testing';
import { AsyncStatusController } from './async-status.controller';

describe('AsyncStatusController', () => {
  let controller: AsyncStatusController;
  const asyncPatternGetStatusMock = {
    getStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsyncStatusController],
      providers: [
        {
          provide: 'IAsyncPatternGetStatus',
          useValue: asyncPatternGetStatusMock,
        },
      ],
    }).compile();

    controller = module.get<AsyncStatusController>(AsyncStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
