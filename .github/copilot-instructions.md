# Scanserve API - AI Agent Instructions

## Architecture Overview

This is a **multi-tenant Express/TypeScript API** for restaurant/retail management (Scanserve). Core patterns:

- **Multi-tenancy via Subdomain**: Businesses identified by subdomain (`pizza-shop.kwiqserve.clopud`). The `subdomainParser` middleware extracts `req.businessSubdomain` from host header, excluding 'www' and 'kwiqserve' subdomains. User type = 'user' requires subdomain context; admins bypass this.
- **Service Layer Pattern**: All database operations through service functions (`createUser`, `findUser`, `findAndUpdateUser` in [src/service/user.service.ts](src/service/user.service.ts)). Never call Mongoose models directly from controllers.
- **Controller-Service-Model**: Controllers handle HTTP, services contain business logic, models define Mongoose schemas.
- **Response Standardization**: **ALWAYS** use [src/responses/](src/responses/) functions: `response.ok()`, `response.created()`, `response.notFound()`, `response.forbidden()`, etc. **NEVER** use `res.json()` or `res.status()` directly.

## Authentication & Authorization

- **JWT-based Auth**: `deserializeUser` middleware extracts JWT from `Authorization: Bearer <token>`, attaches decoded payload to `req.user`. Checks token expiry.
- **Session Validation**: `requiresUser` validates session exists and `session.valid === true`. Rejects expired tokens or invalid sessions.
- **Business Context**: `requiresUser` populates `req.currentBusiness` from subdomain and `req.permissions` from user's business-specific roles.
- **Role-Based Permissions**: 
  - `requiresUser` - authenticates, loads business context, validates session
  - `requiresAdministrator` - checks `userType === 'admin'`
  - `requiresPermissions(['permission.name'])` - checks against `req.permissions` (supports wildcards: `'*'`, `'business.*'`, `'business.users.read'`)
- **Permission Storage**: Users have `businesses[]` array with `business`, `roles[]` (refs to Role documents with `permissions[]`). Admins have top-level `adminRoles[]`.
- **Forbidden Fields**: `rejectForbiddenUserFields` middleware blocks updates to fields in `config.kwiqserveSettings.forbiddenUserFields` (e.g., `emailConfirmed`, `userType`, `email`, `username`, `confirmationCode`).

## Middleware Chain Architecture

**Standard Route Pattern** (order matters):
```typescript
app.patch('/users/profile/:userId',
    requiresUser,                                           // 1. Auth + business context
    requiresPermissions(['*', 'business.users.update']),    // 2. Permission check
    validateRequest(getUserDetailsSchema),                  // 3. Yup validation
    rejectForbiddenUserFields,                              // 4. Field protection (optional)
    adminUpdateUserHandler                                  // 5. Controller
)
```

## Request Context Extensions

Custom properties added to Express Request:
```typescript
req.user              // JWT payload (from deserializeUser)
req.businessSubdomain // Extracted subdomain (from subdomainParser)
req.currentBusiness   // Full Business document (from requiresUser)
req.permissions       // String array of user's permissions (from requiresUser)
```

## Validation & Request Handling

- **Yup Schemas**: All request validation in [src/schema/](src/schema/) using Yup. Structure:
  ```typescript
  export const createUserSchema = object({
      body: object({ /* fields */ }),
      params: object({ /* fields */ }),  // optional
      query: object({ /* fields */ })    // optional
  });
  ```
- **validateRequest Middleware**: `validateRequest(schemaName)` validates and rejects with 400 on failure.

## Database & Data Access

- **Mongoose Models**: All in [src/model/](src/model/). Use Mongoose 5.x API.
- **Service Function Naming**:
  - `create<Model>(input)` - create documents
  - `find<Model>(query, expand?)` - find single (`.lean()` for plain objects)
  - `find<Model>s(query, perPage, page, expand?)` - find multiple with pagination, returns `{ total, data }`
  - `findAndUpdate<Model>(query, update, options)` - update and return
  - `delete<Model>(query)` - delete document
- **Population**: Services accept `expand` param (string or string[]) for `.populate()`. Example: `findUser({_id: userId}, 'businesses.roles')`.
- **Password Handling**: User model has `comparePassword()` method. Never return password in responses (use `omit(user.toJSON(), 'password')`).

## Background Processing

- **Bull Queues**: Redis-backed job queues. Queues in [src/queues/](src/queues/), workers in [src/workers/](src/workers/).
- **Queue Pattern**: Import and call queue functions:
  ```typescript
  import { sendEmailJob } from '../queues/email.queue';
  sendEmailJob({ 
      action: 'email-confirmation-notification', 
      data: { mailTo, firstName, activationCode, subdomain } 
  });
  ```
- **Available Queues**: `sendEmailJob`, `sendQrCodeJob`, `auditLogJob`, `subscriptionRenewalJob`.
- **Worker Startup**: `npm run workers` loads [src/workers/start.ts](src/workers/start.ts), which imports all worker files.
- **Job Configuration**: Jobs configured with `attempts: 5`, `backoff: 10000`, retention policies.

## Cron Jobs

- **node-cron**: Scheduled tasks in [src/cron/](src/cron/). Examples: `backup.cron.ts`, `subscription-charge.cron.ts`.
- **Database Check**: Always check `mongoose.connection.readyState === 1` before DB operations.
- **Initialization**: Crons registered in [src/app.ts](src/app.ts) after DB connection via retry logic (`scheduleBackupWithRetries`).

## Development Workflow

```bash
npm run dev       # nodemon with TypeScript (src/app.ts)
npm run build     # Compile to dist/
npm start         # Run compiled dist/src/app.js
npm run workers   # Start Bull queue workers
```

## Configuration Management

- **config Package**: [config/default.ts](config/default.ts) exports object with environment variables. Access: `const config = require('config'); const port = config.get('port')`.
- **Custom Config Path**: `process.env.NODE_CONFIG_DIR` set in [src/app.ts](src/app.ts) to `../config`.
- **Settings**: `config.kwiqserveSettings` contains app-specific settings like `forbiddenUserFields` (array of protected fields), `postReadRate` (255).

## File Uploads

- **Cloudinary**: Primary storage. Service at [src/service/integrations/cloudinary.service.ts](src/service/integrations/cloudinary.service.ts) exports `upload` middleware (multer-storage-cloudinary).
- **Controller Pattern**: Use `upload.single('fieldName')` or `upload.array('files')` in route, access via `req.file` or `req.files`.

## External Integrations

Located in [src/service/integrations/](src/service/integrations/):
- **Paystack** (`paystack.service.ts`) - Payment processing: `initiateTransaction`, `verifyTransaction`
- **Flutterwave** (`flutterwave.service.ts`) - Alternative payment processor (config exists)
- **MailerSend** (`mailersend.service.ts`) - Email delivery
- **Cloudinary** (`cloudinary.service.ts`) - File storage

## API Response Structure

**Required Response Pattern** (from [src/responses/](src/responses/)):
```typescript
response.ok(res, { data })                // 200
response.created(res, { data })           // 201
response.badRequest(res, { message })     // 400
response.unAuthorized(res, { message })   // 401
response.forbidden(res, { message })      // 403
response.notFound(res, { message })       // 404
response.error(res, { message })          // 500
response.conflict(res, { message })       // 409
```
Responses auto-format as `{ success: true/false, data: {...} }` or `{ success: false, message: '...' }`.

## Transaction & Payment Flow

1. **Create Order**: Order document with `paymentStatus: 'PENDING'`, `status: 'PENDING'`
2. **Create Transaction**: `createTransaction()` with unique `transactionReference` (via `generateCode(18, false)`)
3. **Initiate Payment**: Call `initiateTransaction({ reference, amount, email, callbackUrl })` for Paystack
4. **Webhook/Verification**: `verifyTransaction()` confirms payment, update order: `paymentStatus: 'PAID'`, `status: 'COMPLETED'`

## Database Seeding

- **Seed Functions**: In [src/seeds/](src/seeds/), called on startup in [src/app.ts](src/app.ts): `seedRoles()`, `seedUsers()`.
- **Retry Pattern**: Seeding uses retry logic with exponential backoff if DB not ready.

## Email & Notification Pattern

- **Queue-Based**: All emails via `sendEmailJob({ action, data })` to Bull queue.
- **Actions**: `'email-confirmation-notification'`, `'welcome-email'`, `'order-notification'`, etc.
- **Mailer Service**: [src/service/mailer.service.ts](src/service/mailer.service.ts) contains template functions consumed by email worker.

## WebSocket Real-Time Communication

- **Socket.IO**: WebSocket server initialized in [src/app.ts](src/app.ts), service at [src/service/websocket.service.ts](src/service/websocket.service.ts).
- **Authentication**: Clients connect with JWT token. Sockets join rooms: `user:<userId>` and `business:<businessId>`.
- **Usage from Controllers/Services/Workers**:
  ```typescript
  import { websocketService } from '../service/websocket.service';
  
  // Send to entire business
  websocketService.sendToBusiness(businessId, 'order:new', { orderId, status });
  
  // Send to specific user
  websocketService.sendToUser(userId, 'notification', { message });
  
  // Send to user in business context
  websocketService.sendToBusinessUser(businessId, userId, 'task:assigned', data);
  ```
- **Common Events**: `order:new`, `order:updated`, `payment:completed`, `inventory:updated`, `notification`.
- **Documentation**: Full WebSocket guide at [docs/WEBSOCKET.md](docs/WEBSOCKET.md).

## Common Pitfalls & Best Practices

1. **Response Handling**: Never use `res.json()` or `res.status()` - always use `response.*` functions.
2. **Middleware Order**: Always follow: auth → authorization → validation → field protection → handler.
3. **Error Handling**: Service functions throw errors - wrap controller logic in try-catch, use `response.error(res, { message })`.
4. **Business Context**: For user-type users, `req.currentBusiness` is set by `requiresUser`. Check existence before use.
5. **Permissions**: Wildcard support - `'*'` (all), `'business.*'` (all business ops), `'business.users.read'` (specific).
6. **Session Validation**: `requiresUser` checks `session.business` matches `req.currentBusiness._id` for user-type users.
7. **Token Expiry**: Tokens checked for expiry in `requiresUser` via `user.exp < Date.now()/1000`.
8. **Config Access**: Always use `config.get('key')` pattern, never direct property access.
9. **Service Queries**: Use `.lean()` in services for plain objects, omit for Mongoose documents with methods.
10. **Password Omission**: Always `omit(user.toJSON(), 'password')` before returning user data.
