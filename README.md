# 📝 ToDo List API - Backend

API REST para gestión de tareas con autenticación JWT, construida con **Node.js**, **Express**, **TypeScript**, **SQLite** y **Zod**.

## 🚀 Características

- ✅ CRUD completo de tareas
- 🔐 Autenticación con JWT (registro/login)
- 🛡️ Validación de datos con Zod
- 📦 SQLite como base de datos (fácil despliegue)
- 📝 TypeScript con tipado estricto
- 🧪 Tests de integración con Jest y Supertest
- ✅ Aislamiento de datos por usuario (cada usuario solo ve sus tareas)
- ✅ Manejo centralizado de errores

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js | Runtime |
| Express | Framework HTTP |
| TypeScript | Tipado estático |
| SQLite | Base de datos |
| Zod | Validación de esquemas |
| JWT | Autenticación |
| bcryptjs | Hash de contraseñas |
| Jest + Supertest | Testing |

## 📋 Requisitos previos

- Node.js 18+ 
- npm 9+

## ⚙️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/DuniaMarquina/todo-api.git
cd todo-api

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.test .env

# Editar .env con tus valores
```

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz con:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=tu-contraseña
```

> ⚠️ **Importante**: `JWT_SECRET` debe tener al menos 32 caracteres.

## 🏃 Ejecución

```bash
# Desarrollo 
npm run dev

# El servidor arranca en `http://localhost:3000`.

## 🧪 Tests

```bash
npm test
```

Los tests usan una base de datos **en memoria** (`:memory:`), por lo que no afectan a tus datos de desarrollo.

## 📚 Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Registrar usuario | ❌ |
| POST | `/api/auth/login` | Iniciar sesión | ❌ |

**POST /api/auth/register**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Respuesta 201:**

```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "email": "usuario@ejemplo.com" }
}
```

### Tareas

Todas las rutas requieren el header `Authorization: Bearer <token>`.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/tasks` | Listar tareas del usuario |
| POST | `/api/tasks` | Crear tarea |
| PUT | `/api/tasks/:id` | Actualizar tarea |
| DELETE | `/api/tasks/:id` | Eliminar tarea |

**POST /api/tasks**

```json
{
  "title": "Mi tarea",
  "description": "Descripción opcional"
}
```

**PUT /api/tasks/:id**

```json
{
  "title": "Nuevo título",
  "completed": true
}
```
## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración de 1 día
- Validación estricta de entrada con Zod
- Consultas parametrizadas (prevención de SQL injection)
- Aislamiento de datos por usuario (un usuario no puede ver/modificar tareas ajenas)

## 📝 Licencia

MIT