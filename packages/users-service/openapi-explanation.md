# OpenAPI (users-service) — Explicação didática
## Objetivo
Este documento explica, de forma didática e pronta para ser usada em material de aula, o arquivo `packages/users-service/openapi.yaml` do repositório: o que é, por que existe, como se relaciona com NestJS e exemplos práticos (mapear para controllers/DTOs, servir a spec, gerar clientes, testes de contrato).

Nota: este arquivo foi adaptado para a etapa atual do curso — implementação mínima em Express. A migração para Nest será tratada em uma etapa posterior e terá um apêndice separado.


## 1) Visão geral do `openapi.yaml` (resumo rápido)
O arquivo `packages/users-service/openapi.yaml` é uma especificação OpenAPI 3.1.0 que descreve um contrato mínimo para um serviço de usuários (PoC). Principais pontos:

  - title: Users Service (PoC)
  - version: 0.1.0

  - `GET /health` — health check (200 OK)
  - `POST /users` — cria usuário (request body: `CreateUser`) retorna `User` (201)
## 2) Gerar clients / server stubs (exemplo rápido)
Você pode gerar clients ou server stubs com o OpenAPI Generator. Exemplo (typescript-axios client):

```bash
docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i /local/packages/users-service/openapi.yaml -g typescript-axios -o /local/generated/users-client
```

Como usar (fluxo prático):
1. Gerar o artefato com o comando acima em `generated/`.
2. Entrar na pasta gerada e instalar dependências: `cd generated/users-client && npm install`.
3. Exemplo de uso do client (TypeScript):

```ts
import { UsersApi } from './generated/users-client';

const api = new UsersApi({ basePath: 'http://localhost:3010' });
await api.createUser({ email: 'a@b.com', name: 'Aluno' });
```


## 3) Quando gerar e quando não gerar


## 4) Exemplo mínimo Express (PoC) — ideia rápida
Arquivos úteis (exemplos já presentes no pacote): `server.js`, `users.routes.js`. O servidor roda por padrão em 3010 e expõe `/health` e `/users`.

Trecho de `server.js` de referência:

```js
const path = require('path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');

const usersRouter = require('./users.routes');

const app = express();
app.use(express.json());

app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, 'openapi.yaml'),
    validateRequests: true,
    validateResponses: false,
  })
);

app.use('/users', usersRouter);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3010, () => console.log('users-service listening on http://localhost:3010'));
```


## 5) Testes de contrato (onde e como)
No repositório há exemplos de testes de contrato (ex.: `packages/auth-service/test/contract/openapi.spec.ts`). Padrão simples:

```ts
import fs from 'fs';
import YAML from 'yaml';

const raw = fs.readFileSync('packages/users-service/openapi.yaml', 'utf8');
# OpenAPI (users-service) — Explicação didática

## Objetivo
Este documento explica, de forma didática e pronta para ser usada em material de aula, o arquivo `packages/users-service/openapi.yaml` do repositório: o que é, por que existe, como se relaciona com NestJS e exemplos práticos (mapear para controllers/DTOs, servir a spec, gerar clientes, testes de contrato).

Nota: este arquivo foi adaptado para a etapa atual do curso — implementação mínima em Express. A migração para Nest será tratada em uma etapa posterior e terá um apêndice separado.


## 1) Visão geral do `openapi.yaml` (resumo rápido)
O arquivo `packages/users-service/openapi.yaml` é uma especificação OpenAPI 3.1.0 que descreve um contrato mínimo para um serviço de usuários (PoC). Principais pontos:

  - title: Users Service (PoC)
  - version: 0.1.0

  - `GET /health` — health check (200 OK)
  - `POST /users` — cria usuário (request body: `CreateUser`) retorna `User` (201)


## 2) Gerar clients / server stubs (exemplo rápido)
Você pode gerar clients ou server stubs com o OpenAPI Generator. Exemplo (typescript-axios client):

```bash
docker run --rm -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i /local/packages/users-service/openapi.yaml -g typescript-axios -o /local/generated/users-client
```

Como usar (fluxo prático):
1. Gerar o artefato com o comando acima em `generated/`.
2. Entrar na pasta gerada e instalar dependências: `cd generated/users-client && npm install`.
3. Exemplo de uso do client (TypeScript):

```ts
import { UsersApi } from './generated/users-client';

const api = new UsersApi({ basePath: 'http://localhost:3010' });
await api.createUser({ email: 'a@b.com', name: 'Aluno' });
```


## 3) Quando gerar e quando não gerar


## 4) Exemplo mínimo Express (PoC) — ideia rápida
Arquivos úteis (exemplos já presentes no pacote): `server.js`, `users.routes.js`. O servidor roda por padrão em 3010 e expõe `/health` e `/users`.

Trecho de `server.js` de referência:

```js
const path = require('path');
const express = require('express');
const OpenApiValidator = require('express-openapi-validator');

const usersRouter = require('./users.routes');

const app = express();
app.use(express.json());

app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, 'openapi.yaml'),
    validateRequests: true,
    validateResponses: false,
  })
);

app.use('/users', usersRouter);
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3010, () => console.log('users-service listening on http://localhost:3010'));
```


## 5) Testes de contrato (onde e como)
No repositório há exemplos de testes de contrato (ex.: `packages/auth-service/test/contract/openapi.spec.ts`). Padrão simples:

```ts
import fs from 'fs';
import YAML from 'yaml';

const raw = fs.readFileSync('packages/users-service/openapi.yaml', 'utf8');
const spec = YAML.parse(raw);

expect(spec.paths['/users']).toBeDefined();
expect(spec.components.schemas.CreateUser).toBeDefined();
```

Observações sobre execução:


## 6) Gerar server stubs e adaptar para o pacote
O server stub gerado fornece skeletons de controllers que podem ser adaptados para Express ou migrados para Nest.


## 7) Boas práticas didáticas


## 8) Testes de integração e unitários


## 9) Comparação Express vs Nest.js (resumo)
| Aspecto | Express (mínimo) | Nest.js (completo) |
|---------|------------------|---------------------|
| Rotas | Definidas manualmente em `router` | Decorators em controllers (`@Get`, `@Post`) |
| Validação | `express-validator` manual | `class-validator` + `ValidationPipe` automático |
| Docs/Swagger | Serve YAML estático ou `express-openapi-validator` | Code-first com `@nestjs/swagger` |
| Arquitetura | Simples, procedural | Modular, injeção de dependência |
| Testes | Jest + Supertest manual | `@nestjs/testing` com DI mock fácil |


## 10) Observações sobre OpenAPI 3.1.0


## 11) Próximos passos sugeridos
1. Implementar testes de contrato automatizados (seguindo `auth-service`).
2. Implementar testes de integração (Supertest) para as rotas Express.
3. Migrar para Nest.js (veja seção 12 abaixo).


## 12) Conversão para Nest.js (Fidelidade Total ao Monólito)

### 12.1) Justificativa: Por que migrar de Express para Nest.js?

#### Contexto da decisão
Quando você está extraindo um microsserviço de um monólito existente, uma das decisões arquiteturais mais importantes é: **manter a mesma stack tecnológica ou adotar uma nova?**

Se o monólito já utiliza **Nest.js**, manter a mesma stack tecnológica para o novo microsserviço minimiza significativamente o atrito durante a transição. Aqui estão as razões fundamentadas:

#### Benefícios técnicos

**1. Redução da curva de aprendizado**
- A equipe já conhece os padrões Nest: decorators, módulos, injeção de dependência
- Não há necessidade de treinar desenvolvedores em um novo framework
- Reduz o tempo de onboarding de novos membros no microsserviço
- Mantém a produtividade alta durante a transição

**2. Reutilização de código e convenções**
- **Guards** (autenticação/autorização): copie `JwtAuthGuard`, `RolesGuard` diretamente do monólito
- **Interceptors** (logging, transformação): mesma lógica de observabilidade
- **Pipes** (validação): mesmas regras de negócio aplicadas
- **DTOs**: classes de validação já existentes podem ser migradas ou compartilhadas
- **Utilities e helpers**: funções comuns podem ser extraídas para bibliotecas compartilhadas

**3. Consistência arquitetural**
- Mesma estrutura de pastas (`src/`, `dto/`, `entities/`, `common/`)
- Mesmos padrões de nomenclatura e organização
- Facilita code reviews — revisores já entendem o estilo
- Reduz ambiguidade na decisão de onde colocar código novo

**4. Facilita a extração gradual**
- Você pode **copiar e colar** controllers, services e entities do monólito
- Ajustes mínimos de dependências (ex.: trocar imports relativos)
- Testes unitários do monólito podem ser adaptados rapidamente
- Reduz risco: menos reescrita = menos bugs

**5. Alinhamento com práticas modernas**
- Nest.js é opinativo: força boas práticas (SOLID, DDD, Clean Architecture)
- Modularização clara: cada feature é um módulo isolado
- Testabilidade nativa: `@nestjs/testing` facilita mocks e testes de integração
- Documentação automática: Swagger/OpenAPI integrado via decorators

#### Quando NÃO migrar para Nest.js?

**Considere manter Express simples se:**
- O microsserviço é **extremamente pequeno** (1-2 endpoints)
- Não há planos de crescimento ou adição de features
- A equipe tem pouca experiência com TypeScript/decorators
- O monólito está em Express puro e será descontinuado em breve

**Resultado esperado da migração:**
O provedor mínimo Express (PoC) é refatorado para uma arquitetura Nest.js completa, alinhada com o estilo do monólito, tornando-o **production-ready** e pronto para receber código real extraído do monólito.

---

### 12.2) Fundamentos: Como Nest.js organiza uma aplicação

Antes de migrar, é essencial entender os conceitos-chave do Nest.js:

#### A) Módulos (`@Module`)
- **O que são**: Agrupam funcionalidades relacionadas (controllers, services, providers)
- **Por que usar**: Organização clara, encapsulamento, lazy loading, reutilização
- **Exemplo**: `UsersModule` agrupa `UsersController`, `UsersService`, `User` entity

```ts
@Module({
  imports: [TypeOrmModule.forFeature([User])], // dependências externas
  controllers: [UsersController],               // rotas HTTP
  providers: [UsersService],                    // lógica de negócio
  exports: [UsersService],                      // expor para outros módulos
})
export class UsersModule {}
```

#### B) Controllers (`@Controller`)
- **O que são**: Responsáveis por receber requisições HTTP e retornar respostas
- **Responsabilidade**: Apenas routing e validação de entrada (delegam lógica para services)
- **Decorators**: `@Get()`, `@Post()`, `@Param()`, `@Body()`, `@Query()`

```ts
@Controller('users') // rota base: /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()                    // POST /users
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto); // delega para service
  }

  @Get(':id')                // GET /users/:id
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

#### C) Services (`@Injectable`)
- **O que são**: Contêm a lógica de negócio da aplicação
- **Responsabilidade**: Operações de banco, regras de negócio, integração com APIs externas
- **Injeção de dependência**: Services podem injetar outros services, repositories, etc.

```ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // lógica de negócio: validações, transformações
    const user = this.repo.create(dto);
    return this.repo.save(user);
  }
}
```

#### D) DTOs (Data Transfer Objects)
- **O que são**: Classes que definem a estrutura de dados de entrada/saída
- **Validação automática**: Com `class-validator` + `ValidationPipe`
- **Documentação**: Decorators do Swagger (`@ApiProperty`) geram docs automaticamente

```ts
export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
```

#### E) Pipes, Guards e Interceptors (conceitos avançados)
- **Pipes**: Transformação e validação de dados (`ValidationPipe`, `ParseIntPipe`)
- **Guards**: Controle de acesso (autenticação, autorização)
- **Interceptors**: Lógica antes/depois da execução (logging, cache, transformação)

---

### 12.3) Passo a passo detalhado: Migração Express → Nest.js

#### Etapa 1: Estrutura de diretórios Nest.js

A estrutura típica Nest.js para o `packages/users-service` (seguindo padrão do monólito):

```
packages/users-service/
├── src/
│   ├── main.ts                 # Bootstrap da aplicação (entry point)
│   ├── app.module.ts           # Módulo raiz (importa todos os módulos)
│   │
│   ├── users/                  # Feature: Users
│   │   ├── users.module.ts     # Módulo de usuários
│   │   ├── users.controller.ts # Controller com rotas
│   │   ├── users.service.ts    # Lógica de negócio
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── user.dto.ts     # (ou user-response.dto.ts)
│   │   └── entities/
│   │       └── user.entity.ts  # (se usar TypeORM)
│   │
│   ├── health/                 # Feature: Health checks
│   │   └── health.controller.ts
│   │
│   └── common/                 # Código compartilhado
│       ├── guards/
│       ├── interceptors/
│       ├── pipes/
│       └── decorators/
│
├── test/
│   ├── users.controller.spec.ts  # Testes unitários
│   └── contract/
│       └── openapi.spec.ts       # Testes de contrato
│
├── nest-cli.json               # Config do CLI Nest
├── tsconfig.json               # Config TypeScript
└── package.json
```

**Por que essa estrutura?**
- **Feature-based**: cada feature (users, auth, orders) é uma pasta isolada
- **Modularização clara**: fácil encontrar código relacionado
- **Escalável**: adicionar novas features não bagunça a estrutura
- **Padrão do mercado**: facilita onboarding de novos devs

---

#### Etapa 2: Instalar dependências Nest.js

```bash
cd packages/users-service

# Core Nest.js
npm install @nestjs/common @nestjs/core @nestjs/platform-express

# Swagger (documentação automática)
npm install @nestjs/swagger

# Validação e transformação
npm install class-validator class-transformer

# Reflexão de metadados (necessário para decorators)
npm install reflect-metadata

# Programação reativa (usado internamente pelo Nest)
npm install rxjs

# Dev dependencies
npm install --save-dev @nestjs/cli @nestjs/testing @types/node typescript ts-node
```

**Se usar TypeORM (banco de dados):**
```bash
npm install @nestjs/typeorm typeorm pg  # pg = PostgreSQL driver
```

**O que cada pacote faz?**
- `@nestjs/common`: decorators principais (`@Controller`, `@Injectable`, etc.)
- `@nestjs/core`: engine do framework (DI, lifecycle, etc.)
- `@nestjs/platform-express`: adapter HTTP (usa Express por baixo)
- `@nestjs/swagger`: geração automática de docs OpenAPI
- `class-validator`: validação declarativa com decorators
- `class-transformer`: transformação de objetos plain → classes
- `reflect-metadata`: permite Nest ler metadados de decorators
- `rxjs`: streams e observables (usado internamente)

---

#### Etapa 3: Criar `main.ts` (bootstrap da aplicação)

O `main.ts` é o **entry point** da aplicação. Ele:
1. Cria a aplicação Nest
2. Configura middlewares globais (validação, CORS, etc.)
3. Configura Swagger
4. Inicia o servidor HTTP

```typescript
// packages/users-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Criar aplicação Nest
  const app = await NestFactory.create(AppModule);

  // 2. Configurar validação automática (aplica class-validator em todos os DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // remove propriedades não definidas no DTO
    forbidNonWhitelisted: true, // retorna erro se receber propriedades extras
    transform: true,            // transforma payloads em instâncias de DTOs
  }));

  // 3. Configurar Swagger (documentação automática)
  const config = new DocumentBuilder()
    .setTitle('Users Service (PoC)')
    .setDescription('Minimal users provider - Nest.js version')
    .setVersion('0.1.0')
    .addTag('users')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // UI disponível em /docs

  // 4. Iniciar servidor
  const port = process.env.PORT || 3010;
  await app.listen(port);
  
  console.log(`✅ Users service listening on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
```

**Explicação linha a linha:**
- `NestFactory.create(AppModule)`: instancia a aplicação e monta a árvore de dependências
- `ValidationPipe`: valida automaticamente todos os `@Body()`, `@Param()`, `@Query()` usando class-validator
- `SwaggerModule`: lê decorators do código e gera spec OpenAPI em runtime
- `app.listen(port)`: inicia o servidor HTTP (Express por padrão)

---

#### Etapa 4: Criar `app.module.ts` (módulo raiz)

O módulo raiz importa todos os módulos da aplicação:

```typescript
// packages/users-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    UsersModule,  // módulo de usuários (controllers + services)
    // Outros módulos futuros: AuthModule, OrdersModule, etc.
  ],
  controllers: [
    HealthController, // controllers standalone (sem módulo próprio)
  ],
  providers: [], // services globais (ex.: Logger, Config)
})
export class AppModule {}
```

**Por que separar em módulos?**
- **Encapsulamento**: cada módulo tem suas próprias dependências
- **Lazy loading**: módulos podem ser carregados sob demanda
- **Testabilidade**: testar um módulo isoladamente é mais fácil
- **Organização**: facilita navegação no código

---

#### Etapa 5: Criar Health Controller (endpoint `/health`)

```typescript
// packages/users-service/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('health') // agrupa endpoints no Swagger
@Controller('health') // rota base: /health
export class HealthController {
  @Get() // GET /health
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

**Conceitos:**
- `@ApiTags('health')`: agrupa no Swagger (facilita navegação)
- `@Controller('health')`: define rota base (`/health`)
- `@Get()`: mapeia GET HTTP para este método
- `@ApiResponse`: documenta possíveis respostas (aparece no Swagger)

---

#### Etapa 6: Criar DTOs com validação

**CreateUserDto (entrada):**
```typescript
// packages/users-service/src/users/dto/create-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Email do usuário (único no sistema)'
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiPropertyOptional({ 
    example: 'John Doe',
    description: 'Nome completo do usuário'
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password?: string;
}
```

**UserDto (saída):**
```typescript
// packages/users-service/src/users/dto/user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  name?: string;

  // Nunca expor senha na resposta!
}
```

**Por que DTOs são importantes?**
- **Validação declarativa**: regras claras no código
- **Documentação automática**: Swagger lê os decorators
- **Type safety**: TypeScript garante tipos corretos
- **Separação de responsabilidades**: DTO ≠ Entity (entity tem lógica de persistência)

---

#### Etapa 7: Criar Service (lógica de negócio)

```typescript
// packages/users-service/src/users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable() // marca como provider (pode ser injetado)
export class UsersService {
  // Mock in-memory (em produção: usar Repository do TypeORM)
  private users: Map<string, UserDto> = new Map();

  /**
   * Cria um novo usuário
   * @throws ConflictException se email já existe
   */
  create(createUserDto: CreateUserDto): UserDto {
    // Validação de negócio: email único
    const exists = Array.from(this.users.values())
      .some(u => u.email === createUserDto.email);
    
    if (exists) {
      throw new ConflictException('Email já cadastrado');
    }

    const user: UserDto = {
      id: Date.now().toString(), // em prod: UUID
      email: createUserDto.email,
      name: createUserDto.name,
    };
    
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Busca um usuário por ID
   * @throws NotFoundException se não encontrar
   */
  findOne(id: string): UserDto {
    const user = this.users.get(id);
    
    if (!user) {
      throw new NotFoundException(`Usuário com id ${id} não encontrado`);
    }
    
    return user;
  }

  /**
   * Lista todos os usuários
   */
  findAll(): UserDto[] {
    return Array.from(this.users.values());
  }
}
```

**Por que separar em service?**
- **Testabilidade**: fácil mockar em testes unitários
- **Reutilização**: outros controllers/services podem usar
- **Single Responsibility**: controller cuida de HTTP, service de lógica
- **Transações**: services podem orquestrar múltiplos repositórios

---

#### Etapa 8: Criar Controller (rotas HTTP)

```typescript
// packages/users-service/src/users/users.controller.ts
import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users') // rota base: /users
export class UsersController {
  // Injeção de dependência: Nest injeta UsersService automaticamente
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED) // 201
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  create(@Body() createUserDto: CreateUserDto): UserDto {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários', type: [UserDto] })
  findAll(): UserDto[] {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado', type: UserDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(@Param('id') id: string): UserDto {
    return this.usersService.findOne(id);
  }
}
```

**Explicação dos decorators:**
- `@ApiTags('users')`: agrupa endpoints no Swagger
- `@ApiOperation`: descreve o que o endpoint faz
- `@ApiResponse`: documenta possíveis status codes
- `@Body()`: extrai e valida o body da requisição
- `@Param('id')`: extrai parâmetro de rota (`:id`)
- `@HttpCode(201)`: define status code personalizado

---

#### Etapa 9: Criar Módulo de Usuários

```typescript
// packages/users-service/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [],                     // outros módulos que este módulo precisa
  controllers: [UsersController],  // controllers deste módulo
  providers: [UsersService],       // services e providers deste módulo
  exports: [UsersService],         // exportar para outros módulos usarem
})
export class UsersModule {}
```

**Por que exportar o service?**
- Outros módulos podem precisar dele (ex.: `AuthModule` precisa de `UsersService`)
- Sem `exports`, o service fica privado ao módulo

---

#### Etapa 10: Configurar TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,    // CRÍTICO: permite Nest ler metadados
    "experimentalDecorators": true,   // CRÍTICO: habilita decorators
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

**Configurações críticas:**
- `emitDecoratorMetadata`: sem isso, DI não funciona
- `experimentalDecorators`: habilita `@Injectable`, `@Controller`, etc.

---

#### Etapa 11: Scripts no `package.json`

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

---

#### Etapa 12: Executar o serviço Nest.js

```bash
cd packages/users-service

# Desenvolvimento (com hot-reload)
npm run start:dev

# Produção (build + run)
npm run build
npm run start:prod
```

Acesse:
- API: `http://localhost:3010`
- Swagger UI: `http://localhost:3010/docs`
- Health: `http://localhost:3010/health`

---

### 12.4) Comparação: Antes (Express) vs Depois (Nest.js)

| Aspecto | Express (mínimo) | Nest.js (completo) |
|---------|------------------|---------------------|
| **Rotas** | Definidas manualmente em `router` | Decorators em controllers (`@Get`, `@Post`) |
| **Validação** | `express-validator` manual | `class-validator` + `ValidationPipe` automático |
| **Docs/Swagger** | Serve YAML estático ou middleware | Code-first com `@nestjs/swagger` (auto-gerado) |
| **Arquitetura** | Simples, procedural, pouca estrutura | Modular, injeção de dependência, SOLID |
| **Testes** | Jest + Supertest manual | `@nestjs/testing` com DI mock fácil |
| **Curva aprendizado** | Baixa (ideal para PoC) | Média (requer conhecimento de decorators/DI) |
| **Escalabilidade** | Difícil em projetos grandes | Facilitada por módulos e encapsulamento |
| **Type safety** | Depende de disciplina | Forçado pelo framework |

---

### 12.5) Próximos passos: Da PoC para Produção

**1. Adicionar banco de dados (TypeORM):**
```ts
// app.module.ts
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'pass',
      database: 'users_db',
      entities: [User],
      synchronize: false, // NUNCA true em produção!
    }),
    UsersModule,
  ],
})
```

**2. Adicionar autenticação (JWT):**
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
```

**3. Adicionar observabilidade:**
- Logs estruturados (Winston, Pino)
- Métricas (Prometheus)
- Tracing distribuído (OpenTelemetry)

**4. Migrar código real do monólito:**
- Copiar entities, DTOs, services
- Ajustar imports e dependências
- Rodar testes de contrato para validar compatibilidade

**5. Configurar CI/CD:**
- Build automático
- Testes automatizados
- Deploy em staging/produção

---

## 13) Redirecionamento da raiz (/) para `/docs` e como rodar o serviço em background

Contexto: ao subir a versão Nest.js do serviço a UI do Swagger fica disponível em `/docs`. Para melhorar a experiência didática, é comum redirecionar `/` para `/docs`.

Opções para implementar o redirect

1) Controller Nest (recomendado):

```ts
// packages/users-service/src/root.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class RootController {
  @Get()
  root(@Res() res: Response) {
    return res.redirect('/docs');
  }
}
```

Adicione `RootController` ao `AppModule`.

2) Redirect direto no `main.ts` (quando usar o adapter Express):

```ts
const httpAdapter = app.getHttpAdapter();
const expressApp = httpAdapter.getInstance();
expressApp.get('/', (req, res) => res.redirect('/docs'));
```

Como rodar em background

A) nohup:

```bash
cd packages/users-service
nohup npx ts-node -P tsconfig.nest.json src/main.ts > server.log 2>&1 &
tail -f server.log
```

B) pm2 (recomendado):

```bash
npm install -g pm2
pm2 start --name users-service --interpreter "npx" -- src/main.ts -- -P tsconfig.nest.json
pm2 logs users-service
```


## 14) Testes rápidos (curl)

```bash
curl http://localhost:3010/health
curl -X POST http://localhost:3010/users -H 'Content-Type: application/json' -d '{"email":"aluno@nest.com","name":"Nest User"}'
curl http://localhost:3010/users/<id>
```


### Observações finais

Arquivo criado: `packages/users-service/openapi-explanation.md` — copie as seções que desejar para o material didático.
```

4) Alternativa simples (sem TS): rodar um script Node que valida manualmente a presença das chaves no YAML. Útil para debugging rápido:

```bash
node -e "const fs=require('fs'); const YAML=require('yaml'); const spec=YAML.parse(fs.readFileSync('packages/users-service/openapi.yaml','utf8')); console.log(Object.keys(spec.paths||{}));"
```

5) Interpretação do resultado

- Sucesso: o Jest retornará `PASS` para o arquivo de teste e um resumo com testes executados.
- Falha: a saída mostrará qual asserção falhou (ex.: falta de `/users` ou schemas). Caso veja `No tests found`, siga o passo 3 para instalar/ajustar configuração.

6) Sugestões adicionais

- Se preferir evitar depender de TypeScript no runner de testes, posso adicionar uma versão em JavaScript do teste (`openapi.spec.js`) que utiliza `require('yaml')` e `fs` — diga se quer que eu adicione.
- Para CI: adicione um job simples que execute o comando do passo 1 e falhe o pipeline se os testes de contrato falharem.

---

## 9) Gerar client / server stubs (comandos de exemplo)
<rest of the file remains unchanged>


---

## 10) Observações sobre OpenAPI 3.1.0
- A spec usa 3.1.0; algumas ferramentas podem tratar 3.1 diferente de 3.0. Considere atualizar geradores/linters conforme necessário.

---

## 11) Próximos passos sugeridos

1. Implementar testes de contrato automatizados (seguindo `auth-service`).
2. Implementar testes de integração (Supertest) para as rotas Express.
3. Migrar para Nest.js (veja seção 12 abaixo).

---

## 12) Conversão para Nest.js (Fidelidade Total ao Monólito)

### Justificativa

Se o monólito já utiliza Nest.js, manter a mesma stack tecnológica para o novo microsserviço minimiza o atrito. Isso:
- Reduz a curva de aprendizado da equipe.
- Facilita a reutilização de convenções, pipes, guards e interceptors já existentes.
- Agiliza a transição de código real do monólito para o microsserviço.
- Mantém consistência arquitetural entre serviços.

Resultado esperado: O provedor mínimo Express é refatorado para uma arquitetura Nest.js completa, alinhada com o estilo do monólito, tornando-o pronto para receber e processar os handlers de requisições reais que serão extraídos.

---

### Passo a passo: Migração Express → Nest.js

#### 1) Estrutura de diretórios Nest.js

A estrutura típica Nest.js para o `packages/users-service` (seguindo padrão do monólito):

```
packages/users-service/
├── src/
│   ├── main.ts                 # Bootstrap da aplicação
│   ├── app.module.ts           # Módulo raiz
│   ├── users/
│   │   ├── users.module.ts     # Módulo de usuários
│   │   ├── users.controller.ts # Controller com rotas
│   │   ├── users.service.ts    # Lógica de negócio
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts  # (opcional, se usar TypeORM)
│   └── health/
│       └── health.controller.ts
├── test/
│   ├── users.controller.spec.ts
│   └── contract/
│       └── openapi.spec.ts
├── nest-cli.json
├── tsconfig.json
└── package.json
```

#### 2) Dependências necessárias

Instale as dependências Nest.js no pacote:

```bash
cd packages/users-service
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/swagger class-validator class-transformer reflect-metadata rxjs
npm install --save-dev @nestjs/cli @nestjs/testing @types/node typescript ts-node
```

Se usar TypeORM (como no monólito):
```bash
npm install @nestjs/typeorm typeorm pg
```

#### 3) Arquivo `main.ts` (bootstrap)

Similar ao `src/main.ts` do monólito — inicializa a aplicação, configura Swagger e porta:

```typescript
// packages/users-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validação automática (class-validator)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuração Swagger (code-first)
  const config = new DocumentBuilder()
    .setTitle('Users Service (PoC)')
    .setDescription('Minimal users provider - Nest.js version')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3010;
  await app.listen(port);
  console.log(`Users service listening on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap();
```

#### 4) Módulo raiz `app.module.ts`

Importa os módulos funcionais (UsersModule, HealthModule):

```typescript
// packages/users-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [UsersModule],
  controllers: [HealthController],
})
export class AppModule {}
```

#### 5) Health controller

Endpoint `/health` simples:

```typescript
// packages/users-service/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return { status: 'ok' };
  }
}
```

#### 6) DTOs (Data Transfer Objects)

Use `class-validator` e decorators do Swagger para validação e documentação automática:

```typescript
// packages/users-service/src/users/dto/create-user.dto.ts
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}
```

```typescript
// packages/users-service/src/users/dto/user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  name?: string;
}
```

#### 7) Service (lógica de negócio)

Implemente a lógica mock (ou real, quando migrar do monólito):

```typescript
// packages/users-service/src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private users: Map<string, UserDto> = new Map();

  create(createUserDto: CreateUserDto): UserDto {
    const user: UserDto = {
      id: Date.now().toString(),
      email: createUserDto.email,
      name: createUserDto.name,
    };
    this.users.set(user.id, user);
    return user;
  }

  findOne(id: string): UserDto {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}
```

#### 8) Controller (rotas HTTP)

Mapeia rotas e delega para o service:

```typescript
// packages/users-service/src/users/users.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserDto })
  create(@Body() createUserDto: CreateUserDto): UserDto {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User found', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string): UserDto {
    return this.usersService.findOne(id);
  }
}
```

#### 9) Módulo de usuários

Declara o controller e provider:

```typescript
// packages/users-service/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // se outros módulos precisarem
})
export class UsersModule {}
```

#### 10) Configuração TypeScript

`tsconfig.json` (seguir convenção do monólito):

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

`nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

#### 11) Scripts no `package.json`

Adicione scripts de build/dev/start similares ao monólito:

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  }
}
```

#### 12) Executar o serviço Nest.js

```bash
cd packages/users-service
npm run start:dev
```

Acesse:
- API: `http://localhost:3010`
- Swagger UI: `http://localhost:3010/docs`

#### 13) Testes rápidos (curl)

```bash
curl http://localhost:3010/health
curl -X POST http://localhost:3010/users -H 'Content-Type: application/json' -d '{"email":"aluno@nest.com","name":"Nest User"}'
curl http://localhost:3010/users/<id>
```

#### 14) Testes unitários e E2E

Teste do controller (exemplo):

```typescript
// packages/users-service/test/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should create a user', () => {
    const dto = { email: 'test@example.com', name: 'Test' };
    const result = controller.create(dto);
    expect(result.email).toBe(dto.email);
  });
});
```

Rodar testes:
```bash
npm test
```

---

### Comparação Express vs Nest.js (tabela resumo)

| Aspecto | Express (mínimo) | Nest.js (completo) |
|---------|------------------|---------------------|
| Rotas | Definidas manualmente em `router` | Decorators em controllers (`@Get`, `@Post`) |
| Validação | `express-validator` manual | `class-validator` + `ValidationPipe` automático |
| Docs/Swagger | Serve YAML estático ou `express-openapi-validator` | Code-first com `@nestjs/swagger` |
| Arquitetura | Simples, procedural | Modular, injeção de dependência |
| Testes | Jest + Supertest manual | `@nestjs/testing` com DI mock fácil |
| Curva aprendizado | Baixa (ideal PoC) | Média (requer conhecimento de decorators/DI) |

---

### Estratégia de migração do monólito

1. **Identificar handlers**: liste os endpoints de usuários no monólito (`src/users/users.controller.ts`).
2. **Copiar DTOs e entities**: migre `dto/` e `entities/` do monólito para o microsserviço.
3. **Extrair service**: copie a lógica de `users.service.ts` (ajustar dependências).
4. **Adaptar guards/interceptors**: se o monólito usa guards de autenticação/RBAC, copie para `packages/users-service/src/common/`.
5. **Configurar TypeORM**: se usar banco, configure `TypeOrmModule.forRoot()` no `AppModule` (copiar config do monólito).
6. **Rodar testes end-to-end**: garanta que endpoints do microsserviço retornam os mesmos payloads que o monólito (use testes de contrato).
7. **Deploy lado a lado**: rode monólito e microsserviço em paralelo, roteie tráfego gradualmente (ex.: feature flag ou API Gateway).

---

### Checklist de fidelidade ao monólito

- [ ] Mesma estrutura de pastas (`src/users/`, `dto/`, `entities/`).
- [ ] DTOs com mesmos decorators de validação (`class-validator`).
- [ ] Swagger docs geradas automaticamente (code-first).
- [ ] Mesmos guards (`JwtAuthGuard`, `RolesGuard` etc.) se aplicável.
- [ ] Mesmos interceptors (ex.: logging, transformação).
- [ ] Mesmas variáveis de ambiente e configuração (`.env`, `ConfigModule`).
- [ ] Testes unitários e E2E migrados ou recriados.
- [ ] CI/CD configurado (build, testes, deploy).

---

### Observações finais

- A migração para Nest.js não precisa ser "tudo ou nada" — você pode manter o provedor Express funcionando enquanto desenvolve a versão Nest.js em paralelo e comparar resultados.
- Use o teste de contrato (`openapi.spec.ts`) para validar que ambas as versões (Express e Nest) atendem à mesma spec.
- Documente decisões arquiteturais (ex.: usar TypeORM vs Prisma, guards customizados) no README do pacote para facilitar onboarding da equipe.

---

Arquivo criado: `packages/users-service/openapi-explanation.md` — copie as seções que desejar para o material didático.