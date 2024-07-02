import { Test, TestingModule } from "@nestjs/testing";
import { AsyncInterceptor } from "./async.interceptor";
import { AsyncService } from "src/services/async/async.service";
import { IAsyncService } from "src/interfaces/async-service.interface";

let service: IAsyncService;

beforeEach(async () => {

  const module: TestingModule = await Test.createTestingModule({
    providers: [AsyncService],
  }).compile();

  service = module.get<AsyncService>(AsyncService);
});

describe('AsyncInterceptor', () => {
  it('should be defined', () => {
    expect(new AsyncInterceptor(service)).toBeDefined();
  });
});
