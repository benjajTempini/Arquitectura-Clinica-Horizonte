-- ============================================================================
-- Clínica Horizonte - Inicialización de Base de Datos PostgreSQL
-- ============================================================================

-- Habilitar extensiones para soporte UUID y funciones criptográficas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración de zona horaria por defecto (Chile Continental)
ALTER DATABASE clinica_horizonte SET timezone TO 'America/Santiago';

-- Comentarios explicativos
COMMENT ON DATABASE clinica_horizonte IS 'Base de datos principal de la plataforma Clínica Horizonte';
