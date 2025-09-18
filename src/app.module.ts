import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '~/api/v1/auth/auth.module';
import { DatabaseModule } from '~/database/database.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, DatabaseModule, JobsModule],
})
export class AppModule {}
