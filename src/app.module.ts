import { Module } from '@nestjs/common';
import { AsyncModule } from './modules/async.module';

@Module({
  imports: [AsyncModule]
})
export class AppModule {}
