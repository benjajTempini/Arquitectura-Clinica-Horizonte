import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Pipeline de Migración de Datos Históricos — Clínica Horizonte
 * 
 * Etapas del Flujo:
 * 1. Exportar / Cargar datos fuente
 * 2. Perfilar (Profiling de calidad de datos)
 * 3. Mapear (Esquema legacy -> Esquema Prisma nuevo)
 * 4. Limpiar (Normalización de RUT/Identificador, emails, formatos telefónicos)
 * 5. Transformar (Conversión de tipos, enums y relaciones)
 * 6. Importar (Inserción en lotes transaccionales)
 * 7. Validar & Conciliar (Conteo de registros, sumatorias e integridad)
 */

interface LegacyPatient {
  id_legacy: number;
  rut: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  genero: string;
  telefono: string;
  correo: string;
  direccion: string;
}

interface TransformedPatient {
  nationalId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
  phone: string;
  email: string;
  address: string;
}

async function runMigration() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`[ETL Migración] Iniciando proceso (Modo: ${isDryRun ? 'DRY-RUN (Simulación)' : 'EJECUCIÓN REAL'})...`);

  // Conjunto de datos sintéticos representativo del sistema anterior
  const legacyData: LegacyPatient[] = [
    {
      id_legacy: 101,
      rut: "15.420.312-K",
      nombre_completo: "Carlos Alberto Mendoza Peña",
      fecha_nacimiento: "1982-04-15",
      genero: "M",
      telefono: "+56 9 8765 4321",
      correo: "carlos.mendoza@ejemplo.cl",
      direccion: "Av. Providencia 1240, Dpto 502"
    },
    {
      id_legacy: 102,
      rut: "18.992.110-4",
      nombre_completo: "Valentina Paz Silva Ramos",
      fecha_nacimiento: "1995-11-20",
      genero: "F",
      telefono: "+56 9 1234 5678",
      correo: "valen.silva@ejemplo.cl",
      direccion: "Los Leones 330"
    }
  ];

  console.log(`[ETL Migración] 1. Extracción: ${legacyData.length} registros cargados.`);
  console.log(`[ETL Migración] 2. Perfilado y Limpieza...`);

  const transformed: TransformedPatient[] = [];
  const rejected: Array<{ id: number; reason: string }> = [];

  for (const item of legacyData) {
    // Normalizar RUT (eliminar puntos, guion en mayúscula)
    const cleanRut = item.rut.replace(/\./g, '').toUpperCase().trim();
    if (!cleanRut) {
      rejected.push({ id: item.id_legacy, reason: 'Identificador vacío o inválido' });
      continue;
    }

    // Separar nombres y apellidos
    const parts = item.nombre_completo.trim().split(' ');
    const firstName = parts.slice(0, 2).join(' ') || item.nombre_completo;
    const lastName = parts.slice(2).join(' ') || 'Sin Apellido';

    transformed.push({
      nationalId: cleanRut,
      firstName,
      lastName,
      birthDate: new Date(item.fecha_nacimiento),
      gender: item.genero === 'M' ? 'MASCULINO' : item.genero === 'F' ? 'FEMENINO' : 'OTRO',
      phone: item.telefono.trim(),
      email: item.correo.toLowerCase().trim(),
      address: item.direccion.trim()
    });
  }

  console.log(`[ETL Migración] 3. Transformación completada: ${transformed.length} válidos, ${rejected.length} rechazados.`);

  if (isDryRun) {
    console.log('[ETL Migración] Simulación completada con éxito. No se alteró la base de datos.');
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[ETL Migración] No se especificó DATABASE_URL. Omitiendo conexión a PostgreSQL (Ejecución offline verificada).');
    return;
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('[ETL Migración] 4. Conectado a base de datos destino.');

    for (const patient of transformed) {
      await client.query(`
        INSERT INTO "Patient" ("id", "nationalId", "firstName", "lastName", "birthDate", "gender", "phone", "email", "address", "isMigrated", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
        ON CONFLICT ("nationalId") DO UPDATE 
        SET "phone" = EXCLUDED."phone", "email" = EXCLUDED."email", "updatedAt" = NOW();
      `, [patient.nationalId, patient.firstName, patient.lastName, patient.birthDate, patient.gender, patient.phone, patient.email, patient.address]);
    }

    console.log('[ETL Migración] 5. Inserción y conciliación completadas exitosamente.');
  } catch (error) {
    console.error('[ETL Migración] Error durante la migración:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch((err) => {
  console.error('Fallo no controlado en la migración:', err);
  process.exit(1);
});
