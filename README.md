# CRUD-SPI

## Requisitos
- Node 20+
- MySQL corriendo:
  - **macOS:** MAMP (MySQL en el puerto 8889, phpMyAdmin en http://localhost:8888/phpMyAdmin5/)
  - **Linux:** MySQL/MariaDB o XAMPP (MySQL en el puerto 3306, phpMyAdmin en http://localhost/phpmyadmin/)

## Puerto de la base según el sistema
El back detecta el sistema operativo y elige el puerto de MySQL solo:

| Sistema | Puerto por defecto | Usuario / contraseña típicos |
|---------|--------------------|------------------------------|
| macOS (MAMP) | 8889 | `root` / `root` |
| Linux (MySQL, MariaDB o XAMPP) | 3306 | `root` / vacía (XAMPP) o la que configuraste |

- Deja `DB_PORT=` vacío en el `.env` para usar el puerto automático.
- Si tu MySQL usa otro puerto, escríbelo en `DB_PORT` y ese valor tiene prioridad.
- Al arrancar, el back muestra cuál usó: `Conexión a MySQL establecida (macOS, puerto 8889)`.
- En Linux ajusta `DB_USER` y `DB_PASSWORD` a los de tu instalación.

## Backend (http://localhost:4001)
```bash
cp .env.example .env      # ajusta DB_USER, DB_PASSWORD y JWT_SECRET (ver "Configurar el JWT")
pnpm install
pnpm db:setup          # crea la BD crud_spi, la tabla userscrud y usuarios de prueba
pnpm dev
```

## Configurar el JWT
El login entrega un token JWT que el front manda en cada petición en el header `x-api-token`. Para firmarlo, el back necesita una clave secreta en el `.env`. **Sin ella el servidor no arranca** y muestra `Falta JWT_SECRET en el .env`.

1. Genera una clave aleatoria:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   También sirve `openssl rand -hex 48`.
2. Copia el resultado en el `.env`:
   ```env
   JWT_SECRET=pega_aqui_la_clave_generada
   JWT_EXPIRES_IN=8h
   ```
   `JWT_EXPIRES_IN` es la duración de la sesión (`30m`, `8h`, `1d`, etc.). Al vencer, el front cierra la sesión y avisa "Tu sesión expiró".

Notas:
- Cada persona genera su propia clave; no se comparte ni se sube a git.
- Si cambias la clave, todas las sesiones abiertas dejan de servir y hay que volver a iniciar sesión.

### Qué rutas protege
| Ruta | Acceso |
|------|--------|
| `POST /api/login` | Público |
| `POST /api/users` | Público (registro). Solo un admin con token puede crear otro admin |
| `GET /api/users` | Cualquier usuario con sesión |
| `PUT /api/users/:id` | Solo admin |
| `DELETE /api/users/:id` | Solo admin (no puede eliminarse a sí mismo) |

Probar desde la terminal:
```bash
TOKEN=$(curl -s -H 'Content-Type: application/json' \
  -d '{"email":"admin@crudspi.com","password":"12345"}' \
  http://localhost:4001/api/login | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -H "x-api-token: $TOKEN" http://localhost:4001/api/users
```

## Credenciales de correo
El back envía un correo de bienvenida al registrar un usuario. Las credenciales SMTP **no vienen en el repositorio**: se le piden al asesor del proyecto y se colocan en el `.env`:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=
MAIL_FROM=
SUPPORT_EMAIL=
```

Sin estas variables el CRUD funciona igual; solo falla el envío del correo y el error queda en la consola del back.

## Cargar los datos a la base

El script [src/scripts/setup-db.js](src/scripts/setup-db.js) deja la base lista desde cero:

1. Crea la base de datos `crud_spi` si no existe (usa `DB_NAME` del `.env`).
2. Crea la tabla `userscrud` a partir del modelo de Sequelize.
3. Inserta los usuarios de prueba (ver tabla al final) con la contraseña encriptada con bcrypt.

### Pasos
1. Prende MySQL:
   - **macOS:** abre MAMP y presiona **Start**.
   - **Linux:** `sudo systemctl start mysql` (o `mariadb`), o `sudo /opt/lampp/lampp start` si usas XAMPP.
2. Revisa que el `.env` tenga los datos de conexión:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=
   DB_NAME=crud_spi
   DB_USER=root
   DB_PASSWORD=root
   ```
   Con `DB_PORT` vacío se usa 8889 en macOS y 3306 en Linux. En Linux cambia `DB_PASSWORD` por la tuya.
3. Desde la carpeta `BackEnd-CRUD` ejecuta:
   ```bash
   pnpm db:setup
   ```
   También funciona con `npm run db:setup` o `node src/scripts/setup-db.js`.

### Salida esperada
```
Base de datos "crud_spi" lista
Tabla "userscrud" lista
Creado : admin@crudspi.com (admin)
Creado : juan@crudspi.com (user)
Creado : maria@crudspi.com (user)
```

Puedes verificarlo en phpMyAdmin (macOS: http://localhost:8888/phpMyAdmin5/, Linux: http://localhost/phpmyadmin/) → base `crud_spi` → tabla `userscrud`.

### Notas
- Se puede ejecutar las veces que quieras: si un usuario ya existe, muestra `Ya existe` y no lo duplica ni cambia su contraseña.
- No borra datos ni envía correos.
- Para agregar más usuarios de prueba, edita el arreglo `seedUsers` del script y vuelve a ejecutarlo.
- Si aparece `ECONNREFUSED`, MySQL no está corriendo o usa otro puerto: ponlo en `DB_PORT`. Si aparece `Access denied`, revisa `DB_USER` y `DB_PASSWORD`.
- En Linux con MySQL nativo, `root` suele entrar solo con `sudo` (auth_socket). Lo más simple es crear un usuario para el proyecto:
  ```sql
  CREATE USER 'crud'@'localhost' IDENTIFIED BY 'crud123';
  GRANT ALL PRIVILEGES ON crud_spi.* TO 'crud'@'localhost';
  FLUSH PRIVILEGES;
  ```
  y usar `DB_USER=crud` y `DB_PASSWORD=crud123` en el `.env`.

## Frontend (http://localhost:3000)
```bash
cd ../front-crud-spi
cp .env.example .env      # VITE_API_BASE=http://localhost:4001/api
pnpm install
pnpm dev
```

### Estructura del front
```
src/
├── api/usuario.js            # llamadas HTTP → { ok, data, message }
├── auth/session.js           # logout()
├── components/ui/            # shadcn-vue (button, input, card, table, dialog…)
├── components/               # AppHeader, AppFooter
├── components/usuarios/      # UsuarioFormDialog (crear/editar)
├── composables/              # useTheme, useFormValidation
├── layouts/AppLayout.vue     # página con header
├── lib/utils.js              # cn()
├── plugins/axios.js          # instancia axios (VITE_API_BASE)
├── router/index.js           # rutas con meta (requiresAuth, guestOnly, title)
├── schemas/usuarioSchema.js  # validaciones zod
├── stores/auth.js            # pinia: sesión del usuario
└── views/                    # users/ (login, registro), usuarios/, share/
```

## Usuarios de prueba
| Rol   | Correo             | Contraseña |
|-------|--------------------|------------|
| admin | admin@crudspi.com  | 12345      |
| user  | juan@crudspi.com   | 12345      |
| user  | maria@crudspi.com  | 12345      |

---

# Actividades pendientes

Lista de tareas para quien continúe con el CRUD. Cada una indica qué hacer, dónde y cuándo se considera terminada. Están ordenadas de más a menos prioritaria.

| # | Actividad | Área | Dificultad | Gitmoji | Rama |
|---|-----------|------|------------|---------|------|
| 1 | Rediseñar el correo de bienvenida | Back | Media | 💄 | `actividad/01-correo-bienvenida` |
| 2 | Aceptar términos y condiciones al registrarse | Back + Front | Media | ✨ | `actividad/02-terminos-condiciones` |
| 3 | Vistas separadas para admin y usuario | Back + Front | Media | 🔒️ | `actividad/03-vistas-por-rol` |
| 4 | Validar los datos en el back | Back | Baja | 🦺 | `actividad/04-validaciones-back` |
| 5 | Limitar los intentos de login | Back + Front | Baja | 🔒️ | `actividad/05-limite-login` |
| 6 | Paginación en la tabla de usuarios | Back + Front | Media | ⚡️ | `actividad/06-paginacion` |
| 7 | Permitir que el admin cambie el rol | Back + Front | Baja | ✨ | `actividad/07-cambiar-rol` |
| 8 | Recuperar contraseña por correo | Back + Front | Alta | ✨ | `actividad/08-recuperar-password` |
| 9 | Pruebas automáticas | Back + Front | Media | ✅ | `actividad/09-pruebas` |
| ⭐ 10 | **Actividad pro:** foto de perfil en base64 | Back + Front + BD | Alta | 🗃️ | `actividad/10-foto-perfil` |

La forma de entregar cada actividad está en [Cómo entregar las actividades](#cómo-entregar-las-actividades), al final de este README.

## 1. Rediseñar el correo de bienvenida

**Archivo:** [src/utils/sendEmail.js](src/utils/sendEmail.js) → `sendWelcomeEmail()`

El correo que llega al registrarse se ve mal y tiene problemas técnicos:

- **Colores:** fondo azul marino casi negro (`#000033`) con texto amarillo y naranja. Tiene poco contraste, se lee difícil y no combina con el front.
- **Marca inconsistente:** dice "CRUDSPI" en un lugar y "CRUD-SPI" en otro, y no tiene logo.
- **No tiene un botón para ir al sistema**, que es lo único que el usuario necesita hacer después de registrarse.
- **Dice "puedes responder este correo"**, pero se envía desde una dirección `noreply`.
- **Seguridad:** el nombre se inserta en el HTML sin escapar (`${name}`). Si alguien se registra con HTML en el nombre, ese HTML aparece en el correo.
- **Entregabilidad:** si `MAIL_FROM` usa un dominio distinto al de la cuenta SMTP, el correo puede caer en spam o Gmail puede reescribir el remitente.
- **Compatibilidad:** está hecho con `<div>` y estilos sueltos. Outlook y algunos clientes móviles lo desarman. Tampoco tiene versión de texto plano.

**Qué hacer**
- Rehacer la plantilla con una tabla de 600 px de ancho máximo y estilos inline (la forma compatible con todos los clientes de correo).
- Usar los colores del front: azul `#1D3E6E` para el encabezado y el botón, fondo blanco o gris claro y texto oscuro.
- Escribir el nombre de la marca siempre igual: **CRUD-SPI**.
- Agregar un botón "Iniciar sesión" que apunte a una nueva variable `FRONT_URL` del `.env` (por ejemplo `http://localhost:3000`).
- Escapar el nombre antes de insertarlo (reemplazar `& < > " '`).
- Agregar la versión de texto plano (`text` en `mailOptions`).
- Quitar la frase de "responde este correo" o cambiarla por el correo de `SUPPORT_EMAIL`.
- Hacer que `MAIL_FROM` use la misma cuenta que `SMTP_USER`.

**Terminado cuando:** el correo se ve bien en Gmail web, Gmail móvil y Outlook, en modo claro y oscuro, el botón lleva al login y un nombre como `<b>Hola</b>` aparece como texto y no en negritas.

## 2. Aceptar términos y condiciones al registrarse

**Archivos:** [front-crud-spi/src/views/users/RegistroView.vue](../front-crud-spi/src/views/users/RegistroView.vue), [src/models/users.js](src/models/users.js), [src/controllers/users.js](src/controllers/users.js)

Hoy cualquiera se registra sin aceptar nada. El registro debe exigir que el usuario acepte los términos y condiciones.

**Qué hacer**
- Front:
  - Agregar al formulario de registro una casilla "Acepto los términos y condiciones", donde "términos y condiciones" es un enlace.
  - Al dar clic en el enlace se abre un modal (`AlertDialog` o `Dialog`, ya están en `components/ui/`) con el texto completo, con scroll si es largo, y los botones "Cerrar" y "Acepto".
  - "Acepto" marca la casilla y cierra el modal.
  - El botón "Registrarse" queda deshabilitado hasta que la casilla esté marcada. Agregar la regla al esquema `registroSchema` en `schemas/usuarioSchema.js`.
  - Poner el texto de los términos en su propio componente, por ejemplo `components/TerminosCondiciones.vue`.
- Back:
  - Agregar al modelo la columna `termsAcceptedAt` (fecha).
  - En `POST /api/users` exigir `acceptTerms: true` cuando el registro es público (sin token de admin) y responder `400` si no viene.
  - Guardar la fecha en que se aceptaron.
  - Cuando un admin crea un usuario desde la tabla, no se pide la casilla.

**Terminado cuando:** no es posible registrarse sin aceptar (ni desde el front ni llamando a la API directo), el modal se abre desde el enlace y la fecha de aceptación queda guardada en la base.

## 3. Vistas separadas para admin y usuario

**Archivos:** [front-crud-spi/src/router/index.js](../front-crud-spi/src/router/index.js), [front-crud-spi/src/stores/auth.js](../front-crud-spi/src/stores/auth.js), `front-crud-spi/src/views/`, [src/routes/](src/routes/)

Hoy existe una sola pantalla (`/usuarios`) para los dos roles; solo se ocultan los botones de editar y eliminar cuando no eres admin. Hay que separar las vistas y bloquear el acceso por URL.

**Qué hacer**
- Front:
  - Crear dos vistas:
    - **Admin** (`/admin/usuarios`): la tabla completa con crear, editar y eliminar (lo que hoy hace `UsuariosView.vue`).
    - **Usuario** (`/usuario`): vista propia del usuario normal, por ejemplo "Mi perfil" con sus datos, sin acceso a la gestión de otros usuarios.
  - Marcar la ruta de admin con `meta: { requiresAuth: true, requiresAdmin: true }`. El guard del router ya revisa `requiresAdmin`; falta crear la ruta que lo use.
  - Al iniciar sesión, mandar a cada quien a su vista según el rol: admin → `/admin/usuarios`, usuario → `/usuario`.
  - Si un usuario escribe `/admin/...` en la URL, redirigirlo a `/usuario` y mostrar un toast "No tienes permisos para entrar a esta sección". Opcional: una vista `403`.
  - Mostrar en el header solo los enlaces que le corresponden a cada rol.
- **No confiar solo en el front:** el rol se guarda en `sessionStorage` y cualquiera puede cambiarlo a mano desde las herramientas del navegador (`"role":"admin"`) y así pasar el guard. Para evitarlo:
  - Back: crear `GET /api/me` (con `verificarToken`) que regrese el usuario y el rol **leídos de la base**.
  - Front: antes de entrar a una ruta `requiresAdmin`, confirmar el rol con `/api/me`. Se puede guardar el resultado durante la sesión para no pedirlo en cada navegación. Si no es admin, redirigir a `/usuario`.
  - El back ya responde `403` en `PUT` y `DELETE` para quien no es admin. Revisar que todo endpoint nuevo de admin use `soloAdmin`.

**Terminado cuando:**
- Un admin entra directo a `/admin/usuarios` y un usuario a `/usuario`.
- Un usuario que escribe `/admin/usuarios` en la URL es redirigido y ve el aviso.
- Cambiar `role` a `admin` en `sessionStorage` no da acceso a la vista de admin ni a sus acciones.
- Un admin sí puede entrar a ambas vistas, si así se decide.

## 4. Validar los datos en el back

**Archivos:** [src/controllers/users.js](src/controllers/users.js), nueva carpeta `src/validators/`

Hoy el back solo revisa que `name`, `email` y `password` no vengan vacíos. Las reglas de formato existen solo en el front ([front-crud-spi/src/schemas/usuarioSchema.js](../front-crud-spi/src/schemas/usuarioSchema.js)), y cualquiera que llame a la API directo se las salta.

**Qué hacer**
- Instalar `zod` en el back y crear los mismos esquemas que en el front: correo válido, nombre de 1 a 100 caracteres, contraseña de mínimo 6 caracteres.
- Crear un middleware que valide `req.body` y responda `400` con el mensaje del primer error.
- Aplicarlo en `POST /api/users` y `PUT /api/users/:id`.
- Decidir la regla de contraseña: los usuarios de prueba usan `12345` (5 caracteres) y el front pide mínimo 6. Hay que alinear ambos.

**Terminado cuando:** `curl` con un correo inválido o una contraseña corta responde `400` con un mensaje claro y no crea ni modifica nada.

## 5. Limitar los intentos de login

**Archivos:** [src/routes/login.js](src/routes/login.js), [front-crud-spi/src/views/users/LoginView.vue](../front-crud-spi/src/views/users/LoginView.vue)

Hoy se pueden probar contraseñas sin límite.

**Qué hacer**
- Instalar `express-rate-limit` y aplicarlo solo a `POST /api/login`, por ejemplo 5 intentos cada 15 minutos por IP.
- Responder `429` con `{ "error": "Demasiados intentos, intenta de nuevo en 15 minutos" }`.
- Verificar que el front muestre ese mensaje en el toast.

**Terminado cuando:** el sexto intento fallido seguido responde `429` y el front lo muestra.

## 6. Paginación en la tabla de usuarios

**Archivos:** [src/controllers/users.js](src/controllers/users.js), [front-crud-spi/src/views/usuarios/UsuariosView.vue](../front-crud-spi/src/views/usuarios/UsuariosView.vue)

`GET /api/users` regresa todos los usuarios de una vez. Con muchos registros la tabla se vuelve lenta.

**Qué hacer**
- Back: aceptar `?page=1&limit=10&search=texto`, usar `findAndCountAll` y responder `{ data, total, page, limit }`.
- Front: agregar el componente `Pagination` de shadcn-vue (`npx shadcn-vue@latest add pagination`) y mover la búsqueda al back.

**Terminado cuando:** la tabla muestra 10 usuarios por página, se puede navegar entre páginas y la búsqueda funciona sobre todos los registros, no solo la página actual.

## 7. Permitir que el admin cambie el rol

**Archivos:** [src/controllers/users.js](src/controllers/users.js) → `updateUser`, [front-crud-spi/src/components/usuarios/UsuarioFormDialog.vue](../front-crud-spi/src/components/usuarios/UsuarioFormDialog.vue)

Hoy el rol solo se elige al crear el usuario; al editarlo no se puede cambiar.

**Qué hacer**
- Back: aceptar `role` en `PUT` (solo `user` o `admin`). No permitir que un admin se quite su propio rol ni que el sistema se quede sin ningún admin.
- Front: mostrar el selector de rol también al editar.

**Terminado cuando:** un admin puede convertir a un usuario en admin y viceversa, y el back rechaza con `400` quitarle el rol al último admin.

## 8. Recuperar contraseña por correo

**Qué hacer**
- Back:
  - Endpoint `POST /api/password/forgot` que genere un token de un solo uso con expiración (por ejemplo 30 min) y envíe un correo con el enlace.
  - Endpoint `POST /api/password/reset` que valide el token y cambie la contraseña.
  - Guardar los tokens en una tabla nueva o en columnas del usuario.
- Front: enlace "¿Olvidaste tu contraseña?" en el login, más una vista `/restablecer/:token` con el formulario de nueva contraseña.
- Por seguridad, `forgot` debe responder lo mismo exista o no el correo.

**Terminado cuando:** el flujo completo funciona y un token usado o vencido ya no sirve.

## 9. Pruebas automáticas

Hoy no hay pruebas; todo se verificó a mano.

**Qué hacer**
- Back: `vitest` + `supertest` con pruebas para login (ok, contraseña mala), permisos (sin token `401`, user `403`, admin `200`) y el CRUD completo. Usar una base de pruebas separada (por ejemplo `crud_spi_test`) y desactivar el envío de correos durante las pruebas.
- Front: `vitest` para los esquemas de `schemas/usuarioSchema.js` y el store `stores/auth.js`.
- Agregar el script `pnpm test` en ambos proyectos.

**Terminado cuando:** `pnpm test` corre en verde en ambos proyectos sin tocar la base real ni enviar correos.

## ⭐ 10. Actividad pro: foto de perfil en base64

**Actividad extra.** El usuario debe poder subir una imagen de perfil, guardarla en la base de datos en base64 y verla en el header cada vez que inicia sesión, en lugar del avatar por defecto (`/img/default-avatar.png`).

Esta actividad se construye completa desde cero: la tabla, el modelo, el controlador, las rutas y la pantalla. **No se agrega al script `db:setup`**; la tabla la crea quien haga la actividad.

### Base de datos
Crear una tabla nueva, separada de `userscrud`, para no cargar la imagen cada vez que se consulta la lista de usuarios. Propuesta:

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | INT, PK, autoincrement | |
| `userId` | INT, único, FK → `userscrud.id` | Un usuario tiene una sola foto. `ON DELETE CASCADE` para que se borre con el usuario. |
| `mimeType` | VARCHAR(50) | `image/png`, `image/jpeg` o `image/webp` |
| `data` | MEDIUMTEXT | La imagen en base64, sin el prefijo `data:...;base64,` |
| `size` | INT | Tamaño original en bytes |
| `updatedAt` | DATETIME | Última vez que se cambió |

La tabla se puede crear con SQL en phpMyAdmin o con el modelo de Sequelize. Hay que documentar en este README cuál de las dos se usó y cómo replicarla.

### Back
- **Modelo:** `src/models/avatars.js` con la tabla anterior y la relación `usersCrud.hasOne(avatar)` / `avatar.belongsTo(usersCrud)`.
- **Controlador:** `src/controllers/avatars.js` con:
  - `uploadAvatar`: recibe `{ image: "data:image/png;base64,..." }`, valida el tipo y el tamaño, separa el `mimeType` del base64 y crea o reemplaza la foto del usuario (upsert).
  - `getAvatar`: regresa `{ image: "data:<mimeType>;base64,<data>" }` o `404` si no tiene foto.
  - `deleteAvatar`: borra la foto para volver al avatar por defecto.
- **Rutas:** `src/routes/avatars.js`, montadas en `src/routes/index.js`, todas con `verificarToken`:
  - `PUT /api/users/me/avatar` sube o reemplaza la foto del usuario con sesión.
  - `GET /api/users/me/avatar` la obtiene.
  - `DELETE /api/users/me/avatar` la borra.
  - Opcional: `GET /api/users/:id/avatar` para mostrar las fotos en la tabla de usuarios.
- **Validaciones:**
  - Solo `png`, `jpeg` y `webp`. Revisar el tipo real del contenido, no solo lo que diga el prefijo.
  - Tamaño máximo de 1 MB para la imagen original. En base64 pesa cerca de 33% más.
  - Responder `400` si no cumple y `413` si es demasiado grande.
- **Límite del body:** hoy `express.json()` en `src/server.js` acepta como máximo 100 KB. Hay que subirlo, por ejemplo `express.json({ limit: "2mb" })`, o la petición fallará antes de llegar al controlador.

### Front
- **API:** agregar en `src/api/` (por ejemplo `avatar.js`) `subirAvatar`, `obtenerAvatar` y `eliminarAvatar`, con el mismo patrón `{ ok, data, message }`.
- **Subir la foto:** en el header (`components/AppHeader.vue`), al dar clic en el avatar abrir un modal con:
  - Un `<input type="file" accept="image/png,image/jpeg,image/webp">`.
  - La vista previa de la imagen elegida, convertida con `FileReader.readAsDataURL()`.
  - Botones "Guardar", "Quitar foto" y "Cancelar".
  - Validar tipo y tamaño también en el front antes de enviar.
- **Mostrarla:** guardar la foto en el store `stores/auth.js` (por ejemplo `avatar`). Pedirla al iniciar sesión y al recargar la página, y usarla en el header en lugar de `/img/default-avatar.png`. Si no hay foto, se muestra la de por defecto.

### Terminado cuando
- Un usuario sube una foto, cierra sesión, vuelve a entrar y la ve en el header.
- Al recargar la página la foto sigue ahí.
- Un archivo PDF o una imagen de más de 1 MB se rechaza con un mensaje claro.
- "Quitar foto" regresa al avatar por defecto.
- Al eliminar un usuario, su foto también se borra de la base.
- `GET /api/users` sigue sin incluir las imágenes.

---

# Cómo entregar las actividades

Cada actividad se entrega como un **Pull Request (PR) independiente**, desde un fork del repositorio. Nadie sube cambios directo a `main`: solo entra lo que el responsable revisa y aprueba.

Son dos repositorios, y se trabaja igual en ambos:
- Back: `https://github.com/AlexisRocandio/BackEnd-CRUD`
- Front: `https://github.com/AlexisRocandio/front-crud-spi`

## 1. Preparar el entorno (una sola vez)

1. Haz un **fork** de los dos repositorios: botón **Fork** en GitHub. Quedan copias en tu cuenta (`tu-usuario/BackEnd-CRUD` y `tu-usuario/front-crud-spi`).
2. Clona **tus forks** en una misma carpeta:
   ```bash
   mkdir CRUD-SPI && cd CRUD-SPI
   git clone git@github.com:tu-usuario/BackEnd-CRUD.git
   git clone git@github.com:tu-usuario/front-crud-spi.git
   ```
3. En cada repo, agrega el original como `upstream` para poder traer cambios:
   ```bash
   cd BackEnd-CRUD
   git remote add upstream https://github.com/AlexisRocandio/BackEnd-CRUD.git
   cd ../front-crud-spi
   git remote add upstream https://github.com/AlexisRocandio/front-crud-spi.git
   ```
4. Sigue la instalación de este README (`.env`, `JWT_SECRET`, `pnpm db:setup`). Las credenciales de correo se le piden al asesor.

## 2. Trabajar una actividad

1. Actualiza tu `main` con lo último del original antes de empezar:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```
2. Crea la rama de la actividad con el nombre de la tabla de actividades:
   ```bash
   git checkout -b actividad/03-vistas-por-rol
   ```
   Si la actividad toca back y front, crea **la misma rama en los dos repos**.
3. Haz commits pequeños con **gitmoji** (ver la tabla de abajo):
   ```bash
   git commit -m "🔒️ Agregar endpoint GET /api/me"
   git commit -m "✨ Crear vista de perfil para usuario"
   git commit -m "📝 Documentar las nuevas rutas en el README"
   ```
4. Sube la rama a **tu fork**:
   ```bash
   git push -u origin actividad/03-vistas-por-rol
   ```

## 3. Abrir el Pull Request

1. En GitHub, en tu fork, presiona **Compare & pull request**. El PR va de `tu-usuario:actividad/03-vistas-por-rol` hacia `AlexisRocandio:main`.
2. **Título:** gitmoji de la actividad + número + nombre. Ejemplo: `🔒️ Actividad 3: Vistas separadas para admin y usuario`.
3. **Descripción:** usa esta plantilla:
   ```markdown
   ## Actividad
   3. Vistas separadas para admin y usuario

   ## Qué se hizo
   - ...

   ## Cómo probarlo
   1. ...

   ## Criterios de "Terminado cuando"
   - [ ] Un admin entra directo a /admin/usuarios
   - [ ] ...

   ## PR relacionado
   (si la actividad también tiene PR en el otro repo, poner aquí su enlace)

   ## Capturas
   (si hay cambios visuales)
   ```
4. Si la actividad toca los dos repos, abre un PR en cada uno y enlázalos entre sí.
5. Si te piden cambios, haz nuevos commits en **la misma rama** y súbelos; el PR se actualiza solo. No abras un PR nuevo.

## 4. Cómo se valida (para el revisor)

No hace falta que el colaborador comparta su repositorio. El revisor descarga el PR directo con la [CLI de GitHub](https://cli.github.com/):

```bash
cd BackEnd-CRUD
gh pr list                 # ver los PR abiertos
gh pr checkout 12          # descargar el PR #12 en una rama local
pnpm install && pnpm dev   # probarlo
git checkout main          # regresar a main al terminar
```

Sin `gh`, se puede traer la rama del fork:
```bash
git fetch https://github.com/usuario-del-colaborador/BackEnd-CRUD.git actividad/03-vistas-por-rol:revisar-03
git checkout revisar-03
```

Después de probar, el revisor deja comentarios en el PR, pide cambios o lo aprueba y hace **Merge**. Se recomienda **Squash and merge** para que cada actividad quede como un solo commit en `main`.

## Gitmoji

Cada commit empieza con un emoji que indica qué tipo de cambio es ([gitmoji.dev](https://gitmoji.dev)). Los más usados en este proyecto:

| Gitmoji | Código | Cuándo usarlo |
|---------|--------|---------------|
| ✨ | `:sparkles:` | Nueva funcionalidad |
| 🐛 | `:bug:` | Corregir un error |
| 🔒️ | `:lock:` | Seguridad y permisos |
| 🦺 | `:safety_vest:` | Validaciones |
| 💄 | `:lipstick:` | Estilos e interfaz |
| ⚡️ | `:zap:` | Rendimiento |
| 🗃️ | `:card_file_box:` | Cambios en la base de datos |
| ✅ | `:white_check_mark:` | Pruebas |
| ♻️ | `:recycle:` | Refactorizar sin cambiar el comportamiento |
| 🔧 | `:wrench:` | Configuración (`.env.example`, `vite.config.js`…) |
| ➕ | `:heavy_plus_sign:` | Agregar una dependencia |
| 📝 | `:memo:` | Documentación |
| 🚑️ | `:ambulance:` | Corrección urgente |

Se puede escribir el emoji directo o el código (`:sparkles: Crear vista de perfil`); GitHub muestra ambos como emoji. Para no memorizarlos existe la herramienta `npx gitmoji-cli -c`, que pregunta el tipo de cambio y arma el commit.

## Reglas
- Un PR por actividad. No mezclar dos actividades en el mismo PR.
- Nunca subir el `.env` ni credenciales.
- Antes de abrir el PR, revisar que el back y el front arranquen y que los criterios de "Terminado cuando" se cumplan.
- Si `main` del original cambió mientras trabajabas, actualiza tu rama: `git pull upstream main` estando en ella, resuelve conflictos y súbela de nuevo.
