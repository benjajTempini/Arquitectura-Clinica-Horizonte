# Actividad 1 Unidad 2 Seguridad

## Actores y roles
* **Personal médico:** consultar antecedentes clínicos y registrar la atención de los pacientes autorizados.
* **Personal administrativo:** gestionar la información administrativa y financiera de la clínica.
* **Recepcionista:** coordinar la atención de pacientes y gestionar las citas.
* **Soporte técnico externo:** diagnosticar y solucionar problemas técnicos de la plataforma.
* **Paciente:** solicitar y gestionar sus horas médicas.
* **Administrador del sistema:** administrar los usuarios, permisos y configuraciones de la nueva plataforma.

## Historias de usuario
* Como paciente, quiero consultar las horas disponibles y solicitar una cita con un profesional de la especialidad requerida, para gestionar mi atención sin depender exclusivamente de la recepción.
* Como recepcionista, quiero visualizar en un panel centralizado la disponibilidad de los profesionales y el estado de sus horas, para asignar o reprogramar citas rápidamente y evitar conflictos de horario.
* Como recepcionista, quiero registrar el pago o bono directamente en la cita del paciente, para confirmar la atención y evitar registros financieros desvinculados o incompletos.
* Como profesional médico, quiero consultar un historial clínico cronológico y actualizado de los pacientes asociados a mis atenciones, para tomar decisiones clínicas informadas y mantener continuidad en los tratamientos.
* Como administrador del sistema, quiero consultar un registro de los accesos y modificaciones realizadas sobre información sensible, para investigar incidentes y mantener la trazabilidad de las operaciones.
* Como responsable de la migración, quiero importar los pacientes, citas y antecedentes válidos desde el sistema anterior, para conservar la continuidad operativa y evitar la pérdida de información.
* Como técnico de soporte externo, quiero acceder temporalmente a métricas y registros técnicos autorizados, para diagnosticar incidentes sin consultar innecesariamente información clínica.
* Como administrador del sistema, quiero verificar el estado de los servicios y disponer de copias de seguridad recuperables, para restablecer la plataforma ante una interrupción.

## Stack y diagrama
* **Frontend:** Astrojs + React
* **Backend:** NestJS con API REST y Prisma ORM
* **Base de datos:** PostgreSQL 
* **Infraestructura:** AWS, utilizando S3, CloudFront, ECS Fargate, RDS, Secrets Manager y CloudWatch
* **DOCKER**

*(Imagen referencial: Diagrama de Arquitectura)*

El sistema utilizará Astro como framework principal del frontend, complementado con React para implementar componentes de alta interactividad, como la agenda médica, los formularios clínicos y el panel de recepción. El backend se desarrollará con NestJS mediante una arquitectura monolítica modular y expondrá una API REST para gestionar las reglas de negocio. PostgreSQL se utilizará como base de datos debido al carácter relacional de la información clínica, administrativa y financiera. La infraestructura se desplegará en AWS mediante servicios administrados para alojamiento, persistencia, almacenamiento de documentos, gestión de secretos y monitorización. Esta elección permite mantener una solución modular, segura y viable para el alcance del proyecto.

## Modelo de datos

*(Imagen referencial: Diagrama del Modelo de Datos)*

## Riesgos y backlog

### Prioridad alta
* Autenticación y autorización por roles.
* Migración de pacientes.
* Consulta de pacientes.
* Disponibilidad médica.
* Creación y reprogramación de citas.
* Consulta del historial clínico.
* Registro de atención, diagnóstico y tratamiento.
* Registro de pago o bono.
* Auditoría de accesos y modificaciones.
* Copias de seguridad.

### Prioridad media
* Portal de autoservicio para pacientes.
* Notificaciones de citas.
* Reportes administrativos.
* Emisión de documentos.
* Panel de estado técnico.
* Gestión del acceso temporal de soporte.

### Prioridad futura
* Integraciones con otros prestadores.
* Interoperabilidad clínica.
* Métricas avanzadas.
* Mejoras de accesibilidad.

## Backlog organizado en épicas, tareas y subtareas

### ÉPICA 1: Seguridad y control de acceso
**Objetivo:** proteger la plataforma y asegurar que cada actor acceda únicamente a las funciones e información correspondientes a su rol.

#### Tarea 1.1: Implementar autenticación
* **Prioridad:** Alta
* **Subtareas:**
  * Diseñar la pantalla de inicio de sesión.
  * Crear el endpoint POST /auth/login.
  * Validar correo y contraseña.
  * Almacenar las contraseñas mediante hash seguro.
  * Generar y validar tokens de sesión.
  * Implementar cierre de sesión.
  * Configurar expiración de sesión.
  * Registrar intentos de inicio de sesión.

#### Tarea 1.2: Implementar autorización por roles
* **Prioridad:** Alta
* **Subtareas:**
  * Crear las entidades Usuario, Rol y UsuarioRol.
  * Definir los roles del sistema: Personal médico, Personal administrativo, Recepcionista, Administrador, Soporte externo, Paciente.
  * Crear permisos para cada rol.
  * Implementar guards de autorización en NestJS.
  * Proteger las rutas del frontend según el rol.
  * Impedir el acceso directo a endpoints no autorizados.
  * Crear mensajes de acceso denegado.

#### Tarea 1.3: Implementar auditoría
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad Auditoria.
  * Registrar inicios de sesión.
  * Registrar consultas de fichas clínicas.
  * Registrar creación, modificación y cancelación de citas.
  * Registrar pagos y anulaciones.
  * Registrar cambios de roles y permisos.
  * Guardar fecha, usuario, acción, resultado y entidad afectada.
  * Crear filtros para consultar los registros.
  * Evitar almacenar contraseñas, tokens o contenido clínico completo en los logs.

#### Tarea 1.4: Gestionar el acceso temporal del soporte externo
* **Prioridad:** Media
* **Subtareas:**
  * Crear el rol SOPORTE_EXTERNO.
  * Limitar el acceso a registros técnicos.
  * Impedir el acceso a fichas clínicas.
  * Definir fecha de inicio y expiración del acceso.
  * Registrar las actividades realizadas por soporte.
  * Permitir al administrador revocar el acceso.
  * Ocultar o anonimizar datos sensibles en los registros.

### ÉPICA 2: Migración y continuidad de los datos
**Objetivo:** trasladar de forma segura la información válida desde el sistema anterior hacia la nueva plataforma.

#### Tarea 2.1: Analizar los datos del sistema anterior
* **Prioridad:** Alta
* **Subtareas:**
  * Identificar las tablas o fuentes de datos existentes.
  * Identificar datos de pacientes.
  * Identificar citas y horarios.
  * Identificar antecedentes clínicos.
  * Identificar pagos y datos administrativos.
  * Detectar campos incompletos o incompatibles.
  * Crear un mapeo entre los campos antiguos y nuevos.

#### Tarea 2.2: Migrar pacientes
* **Prioridad:** Alta
* **Subtareas:**
  * Exportar los pacientes del sistema anterior.
  * Validar identificadores personales.
  * Detectar registros duplicados.
  * Normalizar nombres, teléfonos y correos.
  * Transformar los datos al nuevo formato.
  * Importar los registros en PostgreSQL.
  * Generar un informe de registros aceptados y rechazados.
  * Comparar la cantidad de registros antes y después de la migración.

#### Tarea 2.3: Migrar información clínica y administrativa
* **Prioridad:** Alta
* **Subtareas:**
  * Migrar citas históricas.
  * Migrar atenciones clínicas.
  * Migrar diagnósticos y tratamientos.
  * Migrar pagos y bonos.
  * Conservar fechas y responsables cuando estén disponibles.
  * Validar las relaciones entre pacientes, citas y atenciones.
  * Identificar registros que requieran revisión manual.
  * Documentar las transformaciones realizadas.

#### Tarea 2.4: Crear un proceso de migración contenerizado
* **Prioridad:** Alta
* **Subtareas:**
  * Crear un contenedor temporal para la migración.
  * Preparar scripts de extracción y transformación.
  * Configurar la conexión con PostgreSQL.
  * Ejecutar la migración primero en un entorno de pruebas.
  * Registrar errores del proceso.
  * Evitar incluir datos sensibles en los logs.
  * Ejecutar pruebas de integridad después de la importación.

### ÉPICA 3: Gestión de pacientes
**Objetivo:** centralizar y facilitar la administración de los datos personales y de contacto de los pacientes.

#### Tarea 3.1: Registrar pacientes
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad Paciente.
  * Diseñar el formulario de registro.
  * Validar los campos obligatorios.
  * Validar el identificador personal.
  * Evitar registros duplicados.
  * Registrar datos de contacto.
  * Registrar previsión y contacto de emergencia.
  * Crear el endpoint POST /pacientes.

#### Tarea 3.2: Consultar pacientes
* **Prioridad:** Alta
* **Subtareas:**
  * Crear un buscador de pacientes.
  * Permitir búsquedas por identificador.
  * Permitir búsquedas por nombre y apellidos.
  * Mostrar resultados paginados.
  * Crear el endpoint GET /pacientes.
  * Crear el endpoint GET /pacientes/:id.
  * Limitar los datos devueltos según el rol.
  * Registrar el acceso cuando se consulte información sensible.

#### Tarea 3.3: Actualizar datos de pacientes
* **Prioridad:** Alta
* **Subtareas:**
  * Diseñar el formulario de actualización.
  * Permitir modificar teléfono, correo y dirección.
  * Validar los cambios antes de guardarlos.
  * Crear el endpoint PATCH /pacientes/:id.
  * Guardar la fecha de actualización.
  * Registrar al usuario responsable del cambio.
  * Conservar la trazabilidad de modificaciones relevantes.

### ÉPICA 4: Agenda y gestión de citas
**Objetivo:** gestionar la disponibilidad de los profesionales y evitar conflictos en la asignación de horas.

#### Tarea 4.1: Gestionar la disponibilidad médica
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad HorarioProfesional.
  * Configurar días y bloques de atención.
  * Asociar horarios con cada profesional.
  * Asociar profesionales con especialidades.
  * Permitir bloquear horarios no disponibles.
  * Generar intervalos según la duración de cada consulta.
  * Crear el endpoint de consulta de disponibilidad.
  * Mostrar visualmente las horas disponibles y ocupadas.

#### Tarea 4.2: Crear citas
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad Cita.
  * Diseñar el formulario de reserva.
  * Seleccionar paciente, profesional y especialidad.
  * Validar que el profesional atienda la especialidad.
  * Validar que el horario esté disponible.
  * Impedir citas superpuestas.
  * Registrar el origen de la cita.
  * Crear el endpoint POST /citas.
  * Mostrar una confirmación al finalizar.

#### Tarea 4.3: Reprogramar citas
* **Prioridad:** Alta
* **Subtareas:**
  * Permitir seleccionar una cita existente.
  * Mostrar nuevos horarios disponibles.
  * Validar nuevamente la disponibilidad.
  * Registrar el motivo de la reprogramación.
  * Actualizar la fecha de la cita.
  * Crear el endpoint PATCH /citas/:id/reprogramacion.
  * Registrar el cambio en la auditoría.
  * Notificar la nueva fecha al paciente.

#### Tarea 4.4: Cancelar citas
* **Prioridad:** Alta
* **Subtareas:**
  * Permitir cancelar una cita válida.
  * Solicitar el motivo de cancelación.
  * Cambiar el estado a CANCELADA.
  * Liberar el horario correspondiente.
  * Impedir la cancelación de una cita ya completada.
  * Registrar la cancelación en la auditoría.
  * Notificar la cancelación al paciente.

### ÉPICA 5: Portal de autoservicio para pacientes
**Objetivo:** permitir que los pacientes gestionen sus propias horas sin depender exclusivamente de la recepción.

#### Tarea 5.1: Implementar acceso del paciente
* **Prioridad:** Media
* **Subtareas:**
  * Asociar una cuenta de usuario al paciente.
  * Crear el rol PACIENTE.
  * Diseñar el panel del paciente.
  * Limitar el acceso a los datos propios.
  * Mostrar las citas próximas.
  * Mostrar el historial de solicitudes.

#### Tarea 5.2: Permitir la solicitud de horas
* **Prioridad:** Media
* **Subtareas:**
  * Mostrar las especialidades disponibles.
  * Mostrar los profesionales disponibles.
  * Permitir seleccionar una fecha.
  * Mostrar únicamente horarios libres.
  * Permitir ingresar el motivo de consulta.
  * Registrar la solicitud de cita.
  * Mostrar una confirmación.
  * Evitar reservas duplicadas.

#### Tarea 5.3: Gestionar citas propias
* **Prioridad:** Media
* **Subtareas:**
  * Consultar las citas del paciente.
  * Consultar el estado de cada cita.
  * Permitir cancelar dentro del plazo definido.
  * Permitir solicitar una reprogramación.
  * Impedir modificar citas de otros pacientes.
  * Mostrar mensajes claros después de cada operación.

### ÉPICA 6: Gestión clínica
**Objetivo:** permitir que el personal médico consulte antecedentes autorizados y registre la atención de manera estructurada y trazable.

#### Tarea 6.1: Consultar el historial clínico
* **Prioridad:** Alta
* **Subtareas:**
  * Crear una vista cronológica de las atenciones.
  * Mostrar diagnósticos anteriores.
  * Mostrar tratamientos registrados.
  * Mostrar al profesional responsable de cada atención.
  * Verificar que exista una relación asistencial autorizada.
  * Crear el endpoint GET /pacientes/:id/historial-clinico.
  * Registrar cada consulta en la auditoría.
  * Denegar el acceso a usuarios no autorizados.

#### Tarea 6.2: Registrar una atención clínica
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad Atencion.
  * Asociar la atención con la cita correspondiente.
  * Verificar que el profesional esté asignado a la cita.
  * Permitir registrar anamnesis.
  * Permitir registrar observaciones.
  * Permitir registrar indicaciones.
  * Registrar la fecha y el profesional responsable.
  * Crear el endpoint POST /citas/:id/atenciones.

#### Tarea 6.3: Registrar diagnósticos
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad Diagnostico.
  * Asociar el diagnóstico con una atención.
  * Permitir registrar código y descripción.
  * Permitir indicar si es presuntivo o confirmado.
  * Validar campos obligatorios.
  * Registrar la fecha de creación.
  * Evitar que usuarios no autorizados modifiquen diagnósticos.

#### Tarea 6.4: Registrar tratamientos
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad Tratamiento.
  * Asociar el tratamiento con una atención.
  * Registrar nombre y descripción.
  * Registrar dosis.
  * Registrar frecuencia.
  * Registrar duración.
  * Validar los campos clínicos.
  * Mantener la trazabilidad del profesional responsable.

### ÉPICA 7: Pagos y bonos
**Objetivo:** vincular los movimientos financieros con las citas y mantener un historial verificable.

#### Tarea 7.1: Registrar un pago o bono
* **Prioridad:** Alta
* **Subtareas:**
  * Crear la entidad Pago.
  * Asociar el pago con una cita.
  * Permitir seleccionar el tipo de pago.
  * Registrar el importe.
  * Solicitar el número de bono cuando corresponda.
  * Registrar la fecha y el usuario responsable.
  * Crear el endpoint POST /citas/:id/pagos.
  * Actualizar el estado de pago de la cita.
  * Registrar la operación en la auditoría.

#### Tarea 7.2: Consultar pagos
* **Prioridad:** Alta
* **Subtareas:**
  * Mostrar los pagos asociados a una cita.
  * Permitir filtrar por fecha.
  * Permitir filtrar por tipo y estado.
  * Mostrar el usuario que registró la operación.
  * Limitar la información según el rol.
  * Crear un endpoint para consultar pagos.

#### Tarea 7.3: Anular o reembolsar pagos
* **Prioridad:** Media
* **Subtareas:**
  * Validar que el pago pueda anularse.
  * Solicitar el motivo de la operación.
  * Cambiar el estado sin elimin el registro original.
  * Registrar al usuario responsable.
  * Actualizar el estado financiero de la cita.
  * Registrar la modificación en la auditoría.

### ÉPICA 8: Notificaciones y documentos
**Objetivo:** mejorar la comunicación con los pacientes y facilitar la emisión controlada de documentos.

#### Tarea 8.1: Implementar notificaciones de citas
* **Prioridad:** Media
* **Subtareas:**
  * Definir los eventos que generan una notificación.
  * Crear una plantilla de confirmación.
  * Crear una plantilla de reprogramación.
  * Crear una plantilla de cancelación.
  * Registrar el estado del envío.
  * Evitar exponer información clínica sensible.
  * Permitir reintentar notificaciones fallidas.

#### Tarea 8.2: Emitir documentos
* **Prioridad:** Media
* **Subtareas:**
  * Definir los tipos de documentos.
  * Crear plantillas.
  * Asociar los documentos con pacientes y atenciones.
  * Registrar al profesional emisor.
  * Generar un identificador único.
  * Permitir descargar el documento.
  * Registrar la descarga en la auditoría.
  * Almacenar los archivos de forma protegida.

### ÉPICA 9: Reportes y métricas
**Objetivo:** proporcionar información administrativa y operativa para apoyar la gestión de la clínica.

#### Tarea 9.1: Generar reportes administrativos
* **Prioridad:** Media
* **Subtareas:**
  * Crear un reporte de citas.
  * Crear un reporte de pagos.
  * Crear un reporte de cancelaciones.
  * Crear un reporte de inasistencias.
  * Incorporar filtros por periodo.
  * Incorporar filtros por profesional y especialidad.
  * Limitar los reportes según el rol.
  * Permitir exportar los resultados autorizados.

#### Tarea 9.2: Incorporar métricas avanzadas
* **Prioridad:** Futura
* **Subtareas:**
  * Definir indicadores relevantes.
  * Calcular la ocupación de horas médicas.
  * Analizar cancelaciones e inasistencias.
  * Analizar la demanda por especialidad.
  * Diseñar paneles visuales.
  * Incorporar filtros temporales.
  * Evitar mostrar datos personales innecesarios.

### ÉPICA 10: Infraestructura, respaldo y soporte técnico
**Objetivo:** mantener la disponibilidad, recuperación y observabilidad de la plataforma contenerizada.

#### Tarea 10.1: Contenerizar el sistema
* **Prioridad:** Alta
* **Subtareas:**
  * Crear el Dockerfile del frontend Astro SSR.
  * Crear el Dockerfile del backend NestJS.
  * Configurar el contenedor PostgreSQL.
  * Crear el archivo docker-compose.yml.
  * Configurar una red privada entre servicios.
  * Configurar variables de entorno.
  * Añadir health checks.
  * Configurar volúmenes persistentes.
  * Documentar los comandos de despliegue.

#### Tarea 10.2: Implementar copias de seguridad
* **Prioridad:** Alta
* **Subtareas:**
  * Definir qué datos deben respaldarse.
  * Crear respaldos de PostgreSQL.
  * Respaldar documentos almacenados.
  * Proteger y cifrar las copias.
  * Definir una política de retención.
  * Registrar la ejecución de los respaldos.
  * Probar la restauración.
  * Documentar el procedimiento de recuperación.

#### Tarea 10.3: Crear el panel de estado técnico
* **Prioridad:** Media
* **Subtareas:**
  * Crear endpoints de salud para los servicios.
  * Mostrar el estado del frontend.
  * Mostrar el estado del backend.
  * Mostrar el estado de PostgreSQL.
  * Mostrar la fecha de la última verificación.
  * Mostrar errores técnicos sanitizados.
  * Restringir el acceso al administrador y soporte autorizado.
  * Evitar mostrar credenciales o datos clínicos.

### ÉPICA 11: Integraciones e interoperabilidad
**Objetivo:** preparar la plataforma para intercambiar información con otros sistemas autorizados.

#### Tarea 11.1: Integrar otros prestadores
* **Prioridad:** Futura
* **Subtareas:**
  * Identificar los sistemas externos.
  * Definir la información que podrá intercambiarse.
  * Definir mecanismos de autenticación.
  * Diseñar contratos de integración.
  * Registrar las solicitudes y respuestas.
  * Gestionar errores de comunicación.
  * Validar permisos y consentimiento cuando corresponda.

#### Tarea 11.2: Implementar interoperabilidad clínica
* **Prioridad:** Futura
* **Subtareas:**
  * Analizar estándares clínicos aplicables.
  * Definir formatos de intercambio.
  * Mapear pacientes, atenciones y diagnósticos.
  * Validar la integridad de la información recibida.
  * Implementar control de acceso.
  * Registrar los intercambios en auditoría.
  * Crear pruebas de compatibilidad.

### ÉPICA 12: Accesibilidad y experiencia de usuario
**Objetivo:** hacer que la plataforma pueda ser utilizada por más personas y reducir las dificultades de interacción.

#### Tarea 12.1: Incorporar mejoras de accesibilidad
* **Prioridad:** Futura
* **Subtareas:**
  * Mejorar el contraste de colores.
  * Incorporar etiquetas en formularios.
  * Permitir navegación mediante teclado.
  * Mostrar mensajes de error comprensibles.
  * Añadir estados de foco visibles.
  * Revisar el uso con lectores de pantalla.
  * Adaptar la interfaz a distintos tamaños de pantalla.
  * Realizar pruebas de accesibilidad.
