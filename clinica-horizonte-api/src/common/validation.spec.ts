import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { CreateClinicalCareDto } from '../clinical-care/dto/create-clinical-care.dto';
import { DiagnosisDto } from '../clinical-care/dto/diagnosis.dto';
import { CreatePaymentDto } from '../payments/dto/create-payment.dto';
import { PatientQueryDto } from '../patients/dto/patient-query.dto';
import { AppointmentFilterDto } from '../appointments/dto/appointment-filter.dto';
import { DiagnosisType, PaymentMethod } from '@prisma/client';
import {
  isValidRutFormat,
  isValidRutDv,
  isValidNationalId,
  cleanRut,
  formatRut,
} from './utils/rut.util';

describe('Suite de Validación Integral de Datos — Clínica Horizonte', () => {
  describe('Utilidades de RUT y Documentos Oficiales (rut.util)', () => {
    it('debe limpiar y formatear correctamente un RUT con puntos y minúscula', () => {
      expect(cleanRut('15.824.912-k')).toBe('15824912K');
      expect(formatRut('15.824.912-k')).toBe('15824912-K');
    });

    it('debe validar el dígito verificador módulo 11 para RUTs chilenos reales', () => {
      expect(isValidRutDv('15.824.912-K')).toBe(true);
      expect(isValidRutDv('12.345.678-5')).toBe(true);
      expect(isValidRutDv('15.824.912-9')).toBe(false); // DV incorrecto
    });

    it('debe validar identificadores oficiales (RUT chileno y pasaportes)', () => {
      expect(isValidNationalId('15420312-K')).toBe(true);
      expect(isValidNationalId('12345678-5')).toBe(true);
      expect(isValidNationalId('PASSPORT-CL7890')).toBe(true);
      expect(isValidNationalId('123')).toBe(false);
      expect(isValidNationalId('')).toBe(false);
    });
  });

  describe('Validación de DTO de Paciente (CreatePatientDto)', () => {
    it('debe aprobar un paciente con datos completos y válidos', async () => {
      const dto = plainToInstance(CreatePatientDto, {
        nationalId: '15.824.912-K',
        firstName: 'Sofía',
        lastName: 'Contreras',
        birthDate: '1992-05-14',
        gender: 'FEMENINO',
        phone: '+56 9 8123 4567',
        email: 'sofia.contreras@clinicahorizonte.cl',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.nationalId).toBe('15824912-K'); // Normalizado sin puntos
    });

    it('debe rechazar un identificador/RUT mal formado', async () => {
      const dto = plainToInstance(CreatePatientDto, {
        nationalId: '123',
        firstName: 'Sofía',
        lastName: 'Contreras',
        birthDate: '1992-05-14',
        gender: 'FEMENINO',
        phone: '+56 9 8123 4567',
        email: 'sofia@ejemplo.cl',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'nationalId')).toBe(true);
    });

    it('debe rechazar género no perteneciente al catálogo', async () => {
      const dto = plainToInstance(CreatePatientDto, {
        nationalId: '15.824.912-K',
        firstName: 'Sofía',
        lastName: 'Contreras',
        birthDate: '1992-05-14',
        gender: 'INVALIDO',
        phone: '+56 9 8123 4567',
        email: 'sofia@ejemplo.cl',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'gender')).toBe(true);
    });

    it('debe rechazar correo electrónico con formato inválido', async () => {
      const dto = plainToInstance(CreatePatientDto, {
        nationalId: '15.824.912-K',
        firstName: 'Sofía',
        lastName: 'Contreras',
        birthDate: '1992-05-14',
        gender: 'FEMENINO',
        phone: '+56 9 8123 4567',
        email: 'correo-sin-arroba',
      });

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });
  });

  describe('Validación de Atención Clínica y CIE-10 (CreateClinicalCareDto)', () => {
    it('debe aprobar diagnósticos con código CIE-10 estándar (I10, J00, K29.7)', async () => {
      const diag = plainToInstance(DiagnosisDto, {
        code: 'I10',
        description: 'Hipertensión esencial',
        type: DiagnosisType.PRIMARY,
      });

      const errors = await validate(diag);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar códigos CIE-10 inválidos que no cumplan la nomenclatura OMS', async () => {
      const diag = plainToInstance(DiagnosisDto, {
        code: 'invalido-123',
        description: 'Diagnóstico inválido',
        type: DiagnosisType.PRIMARY,
      });

      const errors = await validate(diag);
      expect(errors.some((e) => e.property === 'code')).toBe(true);
    });

    it('debe exigir al menos un diagnóstico en la atención clínica', async () => {
      const care = plainToInstance(CreateClinicalCareDto, {
        reason: 'Control anual preventivo',
        anamnesis: 'Paciente asintomático, sin antecedentes mórbidos relevantes.',
        diagnoses: [],
      });

      const errors = await validate(care);
      expect(errors.some((e) => e.property === 'diagnoses')).toBe(true);
    });
  });

  describe('Validación de Pagos y Parámetros Numéricos (CreatePaymentDto)', () => {
    it('debe rechazar montos de pago negativos', async () => {
      const payment = plainToInstance(CreatePaymentDto, {
        amount: -5000,
        method: PaymentMethod.CASH,
      });

      const errors = await validate(payment);
      expect(errors.some((e) => e.property === 'amount')).toBe(true);
    });

    it('debe aceptar montos cero (gratuidad o cobertura total Fonasa A)', async () => {
      const payment = plainToInstance(CreatePaymentDto, {
        amount: 0,
        method: PaymentMethod.BONO_FONASA,
        voucherNumber: 'FONASA-001',
      });

      const errors = await validate(payment);
      expect(errors.length).toBe(0);
    });
  });

  describe('Validación de Paginación y Filtros de Consulta', () => {
    it('debe rechazar límites y offsets negativos en consultas', async () => {
      const query = plainToInstance(PatientQueryDto, {
        limit: 0,
        offset: -1,
      });

      const errors = await validate(query);
      expect(errors.some((e) => e.property === 'limit')).toBe(true);
      expect(errors.some((e) => e.property === 'offset')).toBe(true);
    });

    it('debe rechazar formatos de fecha mal formados en filtros de agenda', async () => {
      const filter = plainToInstance(AppointmentFilterDto, {
        date: '28-09-2026', // Formato incorrecto DD-MM-YYYY en vez de YYYY-MM-DD
      });

      const errors = await validate(filter);
      expect(errors.some((e) => e.property === 'date')).toBe(true);
    });
  });
});
