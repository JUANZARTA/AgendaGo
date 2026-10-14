/**
 * Textos legales (Términos y condiciones + Política de tratamiento de datos personales).
 * PURO: defaults y helpers de render. El superadmin los edita en Configuración (config/app.legal).
 *
 * ⚠️ BORRADORES: los textos por defecto son una base razonable para Colombia (Ley 1581 de 2012,
 * Decreto 1377 de 2013, Ley 1480 de 2011) pero NO son asesoría legal. Tienen que ser revisados por
 * un abogado antes de publicarse como definitivos (razón social, NIT, domicilio, etc.).
 *
 * Formato: texto plano. Se muestra preservando saltos de línea (white-space: pre-line), nunca como HTML.
 * El token {correo_soporte} se reemplaza al mostrar por el email de soporte de config/app.
 */

import { BRAND_OWNER } from './brand';

/** Token que se reemplaza por el email de soporte configurado. */
export const SUPPORT_EMAIL_TOKEN = '{correo_soporte}';

/** Si no hay email de soporte configurado, el token se reemplaza por esto. */
export const SUPPORT_EMAIL_FALLBACK = 'el canal de soporte indicado dentro de la aplicación';

export const DEFAULT_TERMS = `TÉRMINOS Y CONDICIONES DE USO DE AGENDACO

1. OBJETO
AgendaCo, operada por ${BRAND_OWNER}, es una plataforma web de agendamiento que permite a negocios y profesionales ("Empresas") publicar sus servicios y horarios, y a las personas ("Clientes") reservar, consultar y cancelar citas. AgendaCo actúa únicamente como intermediario tecnológico: no presta los servicios que ofrecen las Empresas ni es parte de la relación entre la Empresa y el Cliente.

2. ACEPTACIÓN
Al crear una cuenta o usar la plataforma, el usuario declara haber leído y aceptado estos Términos y la Política de tratamiento de datos personales. Si no está de acuerdo, debe abstenerse de usar AgendaCo.

3. CUENTAS DE USUARIO
- El usuario debe ser mayor de edad o contar con autorización de su representante legal.
- La información suministrada al registrarse debe ser veraz, completa y actualizada.
- El usuario es responsable de la confidencialidad de su contraseña y de toda actividad realizada desde su cuenta.
- AgendaCo puede suspender o cerrar cuentas que incumplan estos Términos, suministren información falsa o hagan un uso abusivo o fraudulento de la plataforma.

4. SUSCRIPCIÓN DE EMPRESAS
- Las Empresas acceden a la plataforma mediante una suscripción. Al registrarse cuentan con un período de prueba gratuito, cuya duración se informa al momento del registro.
- Finalizada la prueba, para seguir usando el servicio la Empresa debe contratar uno de los planes pagos vigentes (por ejemplo, mensual o semestral). Los precios se informan en pesos colombianos (COP) dentro de la aplicación.
- Los pagos se procesan a través de Wompi, pasarela de pagos de un tercero. AgendaCo no almacena datos de tarjetas ni de medios de pago. El cobro aparece a nombre de ${BRAND_OWNER}, titular de AgendaCo.
- La renovación NO es automática: la Empresa debe realizar manualmente el pago de cada período. La plataforma avisa con anticipación la fecha de vencimiento.
- Vencido el período pagado, la cuenta puede seguir funcionando durante un período de gracia informado en la aplicación. Si no se registra el pago al terminar ese período, la cuenta de la Empresa se suspende y deja de recibir reservas hasta que se regularice el pago.
- Salvo disposición legal en contrario, los valores pagados por períodos ya iniciados no son reembolsables.

5. RESERVA Y CANCELACIÓN DE CITAS
- Las citas reservadas por los Clientes pueden requerir la confirmación de la Empresa.
- El Cliente puede cancelar sus citas pendientes o confirmadas desde la aplicación. La Empresa también puede cancelarlas, indicando de ser posible el motivo.
- Cada Empresa puede tener sus propias políticas de cancelación, puntualidad, inasistencia, precios y pagos de sus servicios, que son de su exclusiva responsabilidad y deben ser informadas al Cliente.

6. RESPONSABILIDADES DE LA EMPRESA
- Mantener actualizada la información de sus servicios, precios, horarios, personal y datos de contacto.
- Prestar los servicios agendados con la calidad, idoneidad y seguridad ofrecidas, y cumplir la normativa aplicable a su actividad, incluida la de protección al consumidor.
- Tratar los datos personales de los Clientes a los que accede por medio de la plataforma únicamente para gestionar sus citas, conforme a la Ley 1581 de 2012.

7. RESPONSABILIDADES DEL CLIENTE
- Suministrar datos de contacto veraces al reservar.
- Asistir puntualmente a las citas o cancelarlas con la debida anticipación.
- Usar la mensajería y las reseñas de forma respetuosa, sin contenido ofensivo, falso, ilegal o que vulnere derechos de terceros.

8. CONTENIDO DE LOS USUARIOS
Los usuarios son responsables del contenido que publican (fotos, descripciones, mensajes y reseñas). AgendaCo puede retirar contenido que infrinja estos Términos o la ley.

9. LIMITACIÓN DE RESPONSABILIDAD
- AgendaCo no garantiza la prestación, calidad ni resultado de los servicios ofrecidos por las Empresas, ni responde por incumplimientos, daños o perjuicios derivados de la relación entre Empresas y Clientes.
- La plataforma se ofrece "tal como está". AgendaCo procura su disponibilidad continua, pero no garantiza que funcione sin interrupciones o errores, ni responde por fallas de internet, de los dispositivos del usuario o de servicios de terceros (como proveedores de infraestructura o pasarelas de pago).
- En la medida permitida por la ley, la responsabilidad de AgendaCo frente a una Empresa se limita al valor pagado por ella en el último período de suscripción.

10. PROPIEDAD INTELECTUAL
La marca AgendaCo, el software, el diseño y los contenidos propios de la plataforma son de su titular. El uso de la plataforma no otorga ninguna licencia sobre ellos más allá de lo necesario para usarla.

11. MODIFICACIONES
AgendaCo puede modificar estos Términos en cualquier momento. Los cambios se publican en esta página con su fecha de actualización. El uso de la plataforma después de la publicación implica la aceptación de los nuevos Términos.

12. LEY APLICABLE Y CONTACTO
Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia se intentará resolver primero de forma directa; de no lograrse, se someterá a los jueces competentes de Colombia, sin perjuicio de los derechos del consumidor ante la Superintendencia de Industria y Comercio.
Para consultas sobre estos Términos, escribe a ${SUPPORT_EMAIL_TOKEN}.`;

export const DEFAULT_PRIVACY = `POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES DE AGENDACO

1. RESPONSABLE DEL TRATAMIENTO
AgendaCo es una plataforma operada por ${BRAND_OWNER}, que es el responsable del tratamiento de los datos personales recolectados a través de la plataforma, en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas que las modifiquen o complementen.
Canal de contacto: ${SUPPORT_EMAIL_TOKEN}.

2. DATOS QUE RECOLECTAMOS
- Datos de identificación y contacto: nombre, correo electrónico y número de teléfono.
- Datos de las citas: negocio, servicio, profesional, fecha, hora, estado, observaciones y motivos de cancelación.
- Fotos: foto de perfil del usuario y fotos que las Empresas publiquen de su negocio.
- Contenido generado: mensajes entre Clientes y Empresas, y reseñas.
- Datos de las Empresas: nombre comercial, dirección, horarios, servicios, precios, personal y datos de los pagos de la suscripción (referencia de la transacción, plan, valor y fecha; no datos de tarjetas).
- Datos técnicos: identificadores de notificaciones del dispositivo y preferencias guardadas en el navegador.

3. FINALIDADES
Los datos se tratan para:
- Crear y administrar la cuenta del usuario y permitir el inicio de sesión.
- Gestionar la reserva, confirmación, recordatorio, cancelación e historial de citas.
- Compartir con la Empresa elegida los datos del Cliente necesarios para atender su cita.
- Enviar notificaciones y permitir la mensajería entre Clientes y Empresas.
- Gestionar las suscripciones y pagos de las Empresas.
- Mostrar estadísticas al negocio y reseñas públicas.
- Brindar soporte, prevenir fraudes, mejorar la plataforma y cumplir obligaciones legales.

4. DERECHOS DEL TITULAR (HABEAS DATA)
Como titular de los datos tienes derecho a:
- Conocer, actualizar y rectificar tus datos personales.
- Solicitar prueba de la autorización otorgada.
- Ser informado sobre el uso que se les ha dado.
- Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual de conservarlos.
- Acceder gratuitamente a tus datos.
- Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley, una vez agotado el trámite de consulta o reclamo ante AgendaCo.

5. CÓMO EJERCER TUS DERECHOS
Puedes enviar consultas y reclamos a ${SUPPORT_EMAIL_TOKEN}, indicando tu nombre, el correo de tu cuenta y tu solicitud.
- Consultas: se responden en un máximo de diez (10) días hábiles, prorrogables por cinco (5) días hábiles más.
- Reclamos: se responden en un máximo de quince (15) días hábiles, prorrogables por ocho (8) días hábiles más.
Muchos datos también pueden actualizarse directamente desde el perfil de la aplicación.

6. TRANSFERENCIA Y TRANSMISIÓN A TERCEROS
Para prestar el servicio, los datos se almacenan y procesan con proveedores tecnológicos que pueden estar ubicados fuera de Colombia:
- Google LLC (Firebase): autenticación, base de datos, alojamiento y notificaciones.
- Wompi (Bancolombia): procesamiento de los pagos de las suscripciones de las Empresas.
Estos proveedores actúan como encargados y cuentan con medidas de seguridad adecuadas. Además, los datos del Cliente necesarios para atender una cita se comparten con la Empresa en la que reserva. AgendaCo no vende datos personales.

7. SEGURIDAD
AgendaCo aplica medidas técnicas y administrativas razonables (control de acceso por usuario, reglas de seguridad en la base de datos y conexiones cifradas) para proteger los datos contra pérdida, uso o acceso no autorizado.

8. DATOS DE MENORES
La plataforma no está dirigida a menores de edad. Sus datos sólo pueden ser suministrados por su representante legal, respetando sus derechos prevalentes.

9. VIGENCIA
Esta Política rige desde su publicación. Los datos se conservarán mientras la cuenta esté activa y durante el tiempo necesario para cumplir las finalidades descritas y las obligaciones legales. Cualquier cambio sustancial se publicará en esta página con su fecha de actualización.`;

/** Reemplaza el token del email de soporte (o un texto genérico si no hay email configurado). */
export function renderLegalText(text: string, supportEmail: string | null | undefined): string {
  const email = (supportEmail ?? '').trim() || SUPPORT_EMAIL_FALLBACK;
  return text.split(SUPPORT_EMAIL_TOKEN).join(email);
}
