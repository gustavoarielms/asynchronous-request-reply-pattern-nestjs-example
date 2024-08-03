import { Controller, Post, Body, HttpCode, Inject, ExecutionContext } from '@nestjs/common';
import { IBusinessInteractor } from '../../interfaces/interactors/business.interface';

@Controller('async')
export class AsyncController {
  constructor(
    @Inject('IBusinessInteractor') private readonly businessInteractor: IBusinessInteractor,
  ) {}

  @Post('save')
  //@Async()
  @HttpCode(202)
  async handleRequest(@Body() body: any): Promise<{ status: string; location: string }> {
    var result = await this.businessInteractor.save(body.data);
    console.log(`Resultado: ${result}`);
    return result;
  }
}
