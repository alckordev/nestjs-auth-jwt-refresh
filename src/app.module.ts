import { Module } from '@nestjs/common';
import { AuthModule } from './api/v1/auth/auth.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
