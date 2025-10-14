# Estratégia recomendada para índices e colunas de texto (citext)

Quando trabalhar com colunas de texto que exigem comportamento case-insensitive (ex.: `email`), siga este conjunto de regras para garantir consistência, rastreabilidade e segurança:

- Use `citext` quando a semântica da coluna for *case-insensitive* (ex.: emails, logins). A extensão `citext` deve ser habilitada por migration: `CREATE EXTENSION IF NOT EXISTS citext;`.

- No Entity (TypeORM): prefira declarar o tipo como `@Column({ type: 'citext' })` e **evite** especificar `length` para `citext` (o Postgres trata `citext` como `text` e o `length` é inócuo/enganoso).

- Unicidade e nomeação de índices:
  - Declare a unicidade de forma explícita e nomeada para evitar índices duplicados e nomes aleatórios gerados por ORMs. Exemplo na entidade:

```ts
@Index('idx_users_email_unique', ['email'], { unique: true })
@Column({ type: 'citext' })
email: string;
```

  - Evite duplicar declarações (`@Index` no topo da classe e `unique: true` no `@Column`). Prefira uma única fonte de verdade (o `@Index` nomeado é uma boa opção).

- Migrations idempotentes e seguras:
  - Migrações que alteram tipos ou índices devem ser idempotentes (usar `IF EXISTS` / `IF NOT EXISTS`) e checar a existência de constraints/índices antes de dropar/criar.
  - Ao alterar o tipo para `citext`, primeiro garanta a extensão e em seguida altere a coluna: `ALTER TABLE users ALTER COLUMN email TYPE citext;`.
  - Para dar nome previsível ao índice/constraint, prefira criar uma migration que: (1) remova constraints/índices com nomes antigos (usando `IF EXISTS`), (2) crie o constraint/index com o nome desejado.

- Evitar índices duplicados:
  - Antes de adicionar um novo índice/constraint, verifique índices existentes (`pg_indexes`) para evitar duplicações.
  - Se existirem índices duplicados, crie uma migration rastreável que drope os índices/constrains redundantes e garanta o índice canônico. Use `ALTER TABLE ... DROP CONSTRAINT IF EXISTS` em vez de `DROP INDEX` quando o índice estiver associado a uma constraint.

- Registro e rastreabilidade:
  - Sempre crie uma migration para alterações de schema (mesmo que tenha executado a alteração manualmente no DB em ambiente local). A migration serve de documentação e garante que outros ambientes (CI, staging, produção) possam reproduzir a mudança.

- Testes e validação pós-migration:
  - Após aplicar a migration em um ambiente de testes, verifique programaticamente:
    - `SELECT extname FROM pg_extension;` (para confirmar `citext`);
    - `SELECT column_name, udt_name FROM information_schema.columns WHERE table_name='users' AND column_name='email';` (para confirmar `citext`);
    - `SELECT indexname FROM pg_indexes WHERE tablename='users';` (para confirmar existência e nome dos índices).

- Recomendações operacionais:
  - Prefira aplicar migrations através dos pipelines/containers (ex: `npm run migration:run` no container) para manter a mesma sequência de migrações entre ambientes.
  - Em caso de emergência em produção, procedimentos manuais (ex.: dropar uma constraint) devem ser sempre seguidos de uma migration que registre o estado final.

Seguindo essas diretrizes, a equipe manterá o esquema consistente, as migrações rastreáveis e evitará índices duplicados ou conflitos gerados por ORMs.
