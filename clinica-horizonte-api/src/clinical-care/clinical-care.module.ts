import { Module } from '@nestjs/common';
import { ClinicalCareController } from './clinical-care.controller';
import { ClinicalCareService } from './clinical-care.service';

@Module({
  controllers: [ClinicalCareController],
  providers: [ClinicalCareService],
  exports: [ClinicalCareService],
})
export class ClinicalCareModule {}
