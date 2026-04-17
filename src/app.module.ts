import { Module } from '@nestjs/common';
import { ExampleAsyncModule } from '../apps/example/src/example/example-async.module';

@Module({
  imports: [ExampleAsyncModule]
})
export class AppModule {}
