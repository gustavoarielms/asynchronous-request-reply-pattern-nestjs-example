import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AsyncController } from './async/async.controller';

@Module({
  imports: [],
  controllers: [AppController, AsyncController],
  providers: [AppService],
})
export class AppModule {}
