import { Module } from '@nestjs/common';
import { ExampleAsyncModule } from './example/example-async.module';

@Module({
  imports: [ExampleAsyncModule]
})
export class AppModule {}
