import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AsyncController } from './controllers/async/async.controller';
import { AsyncModule } from './modules/async.module';
import { AsyncStatusController } from './controllers/async-status/async-status.controller';

@Module({
  imports: [AsyncModule],
  controllers: [AppController, AsyncController, AsyncStatusController],
  providers: [AppService],
})
export class AppModule {}
