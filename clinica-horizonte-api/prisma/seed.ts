import { PrismaClient, RoleName, AppointmentStatus, PaymentMethod, PaymentStatus, DiagnosisType, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Iniciando sembrado de datos sintéticos para Clínica Horizonte...');

  // 1. Roles
  const roles = [
    { name: RoleName.ADMIN, description: 'Administrador total de la plataforma y usuarios' },
    { name: RoleName.DOCTOR, description: 'Médico tratante con acceso a agenda e historial clínico autorizado' },
    { name: RoleName.NURSE, description: 'Personal de enfermería y apoyo clínico' },
    { name: RoleName.RECEPTIONIST, description: 'Recepción, agendamiento de citas y cobros' },
    { name: RoleName.ADMINISTRATIVE, description: 'Personal administrativo, facturación y reportes' },
    { name: RoleName.EXTERNAL_SUPPORT, description: 'Soporte técnico externo auditado y sanitizado' },
    { name: RoleName.PATIENT, description: 'Paciente con acceso a sus citas y solicitudes' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roleMap[r.name] = roleRecord.id;
  }
  console.log('[Seed] Roles creados o actualizados.');

  // 2. Especialidades
  const specialtiesData = [
    { code: 'MED-GEN', name: 'Medicina General', description: 'Atención primaria y medicina preventiva', durationMinutes: 20 },
    { code: 'CAR-01', name: 'Cardiología', description: 'Enfermedades cardiovasculares y electrocardiografía', durationMinutes: 30 },
    { code: 'PED-01', name: 'Pediatría', description: 'Atención integral del lactante, niño y adolescente', durationMinutes: 30 },
    { code: 'TRA-01', name: 'Traumatología', description: 'Lesiones óseas, musculares y articulares', durationMinutes: 20 },
  ];

  const specialtyMap: Record<string, string> = {};
  for (const s of specialtiesData) {
    const specRecord = await prisma.specialty.upsert({
      where: { code: s.code },
      update: { name: s.name, description: s.description, durationMinutes: s.durationMinutes },
      create: s,
    });
    specialtyMap[s.code] = specRecord.id;
  }
  console.log('[Seed] Especialidades creadas.');

  // Hashes de contraseñas de desarrollo sintéticas
  const defaultPasswordHash = await bcrypt.hash('Clinica2026!', 10);

  // 3. Usuarios base
  const usersData = [
    {
      email: 'admin@clinicahorizonte.cl',
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: RoleName.ADMIN,
    },
    {
      email: 'recepcion@clinicahorizonte.cl',
      firstName: 'Camila',
      lastName: 'Pérez Receptora',
      role: RoleName.RECEPTIONIST,
    },
    {
      email: 'dr.morales@clinicahorizonte.cl',
      firstName: 'Roberto',
      lastName: 'Morales Soto',
      role: RoleName.DOCTOR,
    },
    {
      email: 'dra.valenzuela@clinicahorizonte.cl',
      firstName: 'Carolina',
      lastName: 'Valenzuela Ríos',
      role: RoleName.DOCTOR,
    },
    {
      email: 'soporte.ext@clinicahorizonte.cl',
      firstName: 'Esteban',
      lastName: 'Soporte Externo',
      role: RoleName.EXTERNAL_SUPPORT,
    },
  ];

  const userMap: Record<string, string> = {};
  for (const u of usersData) {
    const userRecord = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: {
        email: u.email,
        passwordHash: defaultPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });
    userMap[u.email] = userRecord.id;

    // Asignar rol
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: userRecord.id,
          roleId: roleMap[u.role],
        },
      },
      update: {},
      create: {
        userId: userRecord.id,
        roleId: roleMap[u.role],
      },
    });
  }
  console.log('[Seed] Usuarios y roles asignados.');

  // 4. Profesionales
  const profMorales = await prisma.professional.upsert({
    where: { licenseNumber: 'MED-CL-48201' },
    update: { userId: userMap['dr.morales@clinicahorizonte.cl'] },
    create: {
      licenseNumber: 'MED-CL-48201',
      firstName: 'Roberto',
      lastName: 'Morales Soto',
      email: 'dr.morales@clinicahorizonte.cl',
      phone: '+56 9 7654 3210',
      userId: userMap['dr.morales@clinicahorizonte.cl'],
    },
  });

  const profValenzuela = await prisma.professional.upsert({
    where: { licenseNumber: 'MED-CL-59104' },
    update: { userId: userMap['dra.valenzuela@clinicahorizonte.cl'] },
    create: {
      licenseNumber: 'MED-CL-59104',
      firstName: 'Carolina',
      lastName: 'Valenzuela Ríos',
      email: 'dra.valenzuela@clinicahorizonte.cl',
      phone: '+56 9 9812 3456',
      userId: userMap['dra.valenzuela@clinicahorizonte.cl'],
    },
  });

  // Vincular especialidades a profesionales
  await prisma.professionalSpecialty.upsert({
    where: { professionalId_specialtyId: { professionalId: profMorales.id, specialtyId: specialtyMap['MED-GEN'] } },
    update: {},
    create: { professionalId: profMorales.id, specialtyId: specialtyMap['MED-GEN'] },
  });
  await prisma.professionalSpecialty.upsert({
    where: { professionalId_specialtyId: { professionalId: profMorales.id, specialtyId: specialtyMap['CAR-01'] } },
    update: {},
    create: { professionalId: profMorales.id, specialtyId: specialtyMap['CAR-01'] },
  });
  await prisma.professionalSpecialty.upsert({
    where: { professionalId_specialtyId: { professionalId: profValenzuela.id, specialtyId: specialtyMap['PED-01'] } },
    update: {},
    create: { professionalId: profValenzuela.id, specialtyId: specialtyMap['PED-01'] },
  });

  // Horarios de atención (Lunes a Viernes de 09:00 a 17:00)
  for (let day = 1; day <= 5; day++) {
    const existingSched = await prisma.professionalSchedule.findFirst({
      where: { professionalId: profMorales.id, dayOfWeek: day },
    });
    if (!existingSched) {
      await prisma.professionalSchedule.create({
        data: {
          professionalId: profMorales.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 20,
        },
      });
    }
  }

  // 5. Pacientes sintéticos
  const patientsData = [
    {
      nationalId: '12345678-5',
      firstName: 'Juan Pablo',
      lastName: 'Araya Fuentes',
      birthDate: new Date('1985-06-14'),
      gender: 'MASCULINO',
      phone: '+56 9 9123 4567',
      email: 'juan.araya@ejemplo.cl',
      address: 'Calle Los Alerces 450, Santiago',
      emergencyContact: 'Luisa Fuentes (Madre) +56 9 8888 7777',
    },
    {
      nationalId: '14567890-K',
      firstName: 'María Ignacia',
      lastName: 'González Castro',
      birthDate: new Date('1990-12-03'),
      gender: 'FEMENINO',
      phone: '+56 9 8234 5678',
      email: 'maria.gonzalez@ejemplo.cl',
      address: 'Av. Las Condes 9820, Depto 301',
      emergencyContact: 'Rodrigo González (Hermano) +56 9 7777 6666',
    },
    {
      nationalId: '16789012-3',
      firstName: 'Pedro Matías',
      lastName: 'Tapia Vera',
      birthDate: new Date('1998-03-25'),
      gender: 'MASCULINO',
      phone: '+56 9 7345 6789',
      email: 'pedro.tapia@ejemplo.cl',
      address: 'Pasaje San Cristóbal 112',
      emergencyContact: 'Ana Vera (Cónyuge) +56 9 6666 5555',
    },
  ];

  const patientMap: Record<string, string> = {};
  for (const p of patientsData) {
    const patRecord = await prisma.patient.upsert({
      where: { nationalId: p.nationalId },
      update: { phone: p.phone, email: p.email, address: p.address },
      create: p,
    });
    patientMap[p.nationalId] = patRecord.id;
  }
  console.log('[Seed] Pacientes sintéticos registrados.');

  // 6. Citas y Atenciones de prueba
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - 2);
  pastDate.setHours(10, 0, 0, 0);

  const pastEndDate = new Date(pastDate);
  pastEndDate.setMinutes(pastEndDate.getMinutes() + 20);

  // Cita Completada con Ficha Clínica y Pago
  const pastAppt = await prisma.appointment.create({
    data: {
      patientId: patientMap['12345678-5'],
      professionalId: profMorales.id,
      specialtyId: specialtyMap['MED-GEN'],
      startTime: pastDate,
      endTime: pastEndDate,
      status: AppointmentStatus.COMPLETED,
      reason: 'Control anual de salud preventivo',
    },
  });

  await prisma.payment.create({
    data: {
      appointmentId: pastAppt.id,
      amount: 15000.0,
      method: PaymentMethod.BONO_FONASA,
      status: PaymentStatus.PAID,
      voucherNumber: 'FONASA-994821',
      payerName: 'Juan Pablo Araya Fuentes',
      registeredById: userMap['recepcion@clinicahorizonte.cl'],
    },
  });

  const clinicalCare = await prisma.clinicalCare.create({
    data: {
      appointmentId: pastAppt.id,
      patientId: patientMap['12345678-5'],
      professionalId: profMorales.id,
      reason: 'Paciente acude para chequeo médico rutinario',
      anamnesis: 'Refiere cefalea ocasional de predominio vespertino. Sin otros síntomas agudos.',
      physicalExam: 'Buen estado general. Cardiopulmonar sin ruidos patológicos. Abdomen blando e indoloro.',
      vitalSigns: JSON.stringify({ pa: '135/85 mmHg', fc: '72 lpm', temp: '36.5 °C', peso: '78 kg', talla: '1.75 m' }),
      indication: 'Mantener dieta hiposódica, actividad física regular y control de presión arterial semanal.',
    },
  });

  await prisma.diagnosis.create({
    data: {
      clinicalCareId: clinicalCare.id,
      code: 'I10',
      description: 'Hipertensión esencial (primaria) en observación',
      type: DiagnosisType.PRIMARY,
    },
  });

  await prisma.treatment.create({
    data: {
      clinicalCareId: clinicalCare.id,
      medication: 'Losartán Potásico',
      dosage: '50 mg',
      frequency: 'Cada 24 horas (mañana)',
      durationDays: 30,
      instructions: 'Tomar con abundante agua antes del desayuno. Control en 30 días.',
    },
  });

  // Cita Futura Confirmada
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + 1);
  futureDate.setHours(11, 0, 0, 0);
  const futureEndDate = new Date(futureDate);
  futureEndDate.setMinutes(futureEndDate.getMinutes() + 20);

  await prisma.appointment.create({
    data: {
      patientId: patientMap['14567890-K'],
      professionalId: profMorales.id,
      specialtyId: specialtyMap['CAR-01'],
      startTime: futureDate,
      endTime: futureEndDate,
      status: AppointmentStatus.CONFIRMED,
      reason: 'Evaluación cardiológica por palpitaciones',
    },
  });

  // 7. Evento de Auditoría inicial
  await prisma.auditEvent.create({
    data: {
      userId: userMap['admin@clinicahorizonte.cl'],
      action: AuditAction.CREATE,
      resource: 'SYSTEM_SEED',
      details: JSON.stringify({ message: 'Sembrado inicial de base de datos completado exitosamente.' }),
      ipAddress: '127.0.0.1',
      userAgent: 'NestJS Seed Script',
    },
  });

  console.log('[Seed] Sembrado completado con éxito.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error sembrando datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
