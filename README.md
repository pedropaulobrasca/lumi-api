# 🌟 Lumi API - Sistema de Gerenciamento de Faturas de Energia

<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <br>
  <h3>API para processamento e análise de faturas de energia elétrica</h3>
</div>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-requisitos">Requisitos</a> •
  <a href="#-instalação">Instalação</a> •
  <a href="#-configuração">Configuração</a> •
  <a href="#-executando-o-projeto">Executando</a> •
  <a href="#-migrações">Migrações</a> •
  <a href="#-documentação-da-api">Documentação</a> •
  <a href="#-estrutura-do-projeto">Estrutura</a> •
  <a href="#-rotas-da-api">Rotas da API</a>
</p>

## 📋 Sobre o Projeto

O Lumi API é um sistema desenvolvido para processar e analisar faturas de energia elétrica. A aplicação permite o upload de faturas em PDF, extrai automaticamente os dados relevantes e calcula métricas importantes como consumo de energia, economia com geração distribuída (GD) e valores totais.

Este projeto foi desenvolvido com NestJS, um framework progressivo para construção de aplicações server-side eficientes e escaláveis em Node.js.

## ✨ Funcionalidades

- 📄 **Upload de Faturas**: Processamento de faturas de energia em formato PDF
- 🔍 **Extração de Dados**: Identificação automática de informações como consumo, valores e referência
- 📊 **Cálculos Automáticos**: Cálculo de métricas como economia com GD e valor total
- 🗄️ **Armazenamento**: Persistência dos dados em banco PostgreSQL
- 🔄 **Consultas**: API RESTful para consulta e listagem de faturas processadas
- 📱 **Documentação**: Interface Swagger para testes e documentação da API
- 🔍 **Filtragem Avançada**: Busca de faturas por cliente e período de referência
- 📋 **Listagem de Meses**: Endpoint para listar todos os meses de referência disponíveis
- 👥 **Listagem de Clientes**: Endpoint para listar todos os clientes cadastrados
- 🛡️ **Validação de Duplicidade**: Sistema para evitar cadastros duplicados de faturas
- ⚠️ **Tratamento de Erros**: Mensagens de erro claras e específicas

## 🚀 Tecnologias

O projeto utiliza as seguintes tecnologias:

- [NestJS](https://nestjs.com/) - Framework Node.js
- [TypeORM](https://typeorm.io/) - ORM para banco de dados
- [PostgreSQL](https://www.postgresql.org/) - Banco de dados relacional
- [Redis](https://redis.io/) - Cache de dados
- [TypeScript](https://www.typescriptlang.org/) - Superset tipado de JavaScript
- [Swagger](https://swagger.io/) - Documentação da API
- [Docker](https://www.docker.com/) - Containerização
- [PDF Parse](https://www.npmjs.com/package/pdf-parse) - Processamento de arquivos PDF

## 📋 Requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/en/) (v18 ou superior)
- [PNPM](https://pnpm.io/) (v8 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) (para ambiente containerizado)
- [PostgreSQL](https://www.postgresql.org/) (opcional, se não usar Docker)

## 🔧 Instalação

Clone o repositório e instale as dependências:

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/lumi-api.git
cd lumi-api

# Instale as dependências
pnpm install
```

## ⚙️ Configuração

### Variáveis de Ambiente

O projeto utiliza as seguintes variáveis de ambiente (com valores padrão):

| Variável       | Valor Padrão      | Descrição                       |
|----------------|-------------------|----------------------------------|
| DB_HOST        | localhost         | Host do banco de dados          |
| DB_PORT        | 5432              | Porta do banco de dados         |
| DB_USER        | postgres          | Usuário do banco de dados       |
| DB_PASSWORD    | secret            | Senha do banco de dados         |
| DB_NAME        | energy_invoices   | Nome do banco de dados          |
| REDIS_HOST     | localhost         | Host do Redis                   |
| REDIS_PORT     | 6379              | Porta do Redis                  |
| PORT           | 3000              | Porta da aplicação              |

## 🚀 Executando o Projeto

### Ambiente de Desenvolvimento

Para executar o projeto em ambiente de desenvolvimento:

```bash
# Iniciar PostgreSQL e Redis em containers
docker-compose -f docker-compose.dev.yml up -d

# Executar migrações do banco de dados
pnpm dlx typeorm-ts-node-commonjs migration:run -d src/config/typeorm.config.ts

# Iniciar a aplicação em modo de desenvolvimento
pnpm start:dev
```

A aplicação estará disponível em: http://localhost:3000

### Ambiente de Produção

Para executar o projeto em ambiente de produção:

```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Ver logs da aplicação
docker-compose logs -f app
```

## 🔄 Migrações

O projeto utiliza TypeORM para gerenciar migrações do banco de dados:

```bash
# Executar migrações pendentes
pnpm dlx typeorm-ts-node-commonjs migration:run -d src/config/typeorm.config.ts

# Reverter última migração
pnpm dlx typeorm-ts-node-commonjs migration:revert -d src/config/typeorm.config.ts

# Criar nova migração
pnpm dlx typeorm-ts-node-commonjs migration:create src/migrations/NomeDaMigracao
```

## 📖 Documentação da API

A documentação completa da API está disponível através da interface Swagger após iniciar o servidor:

```
http://localhost:3000/api/docs
```

## 🔗 Rotas da API

A API oferece as seguintes rotas principais:

### Faturas

- `GET /invoices` - Lista todas as faturas com suporte a filtros
  - Parâmetros de consulta:
    - `clientNumber` - Filtra faturas por número do cliente
    - `startMonth` - Filtra faturas a partir de um mês de referência

- `GET /invoices/:id` - Obtém detalhes de uma fatura específica

- `POST /invoices/upload` - Faz upload e processa uma nova fatura
  - Corpo: `multipart/form-data` com campo `file` contendo o arquivo PDF da fatura

- `GET /invoices/reference-months/list` - Lista todos os meses de referência disponíveis
  - Retorna um array de strings com os meses de referência ordenados do mais recente para o mais antigo

- `GET /invoices/clients/list` - Lista todos os clientes cadastrados
  - Retorna um array de objetos contendo `clientNumber` e `installationNumber` ordenados por número do cliente

A documentação da API está disponível através do Swagger UI:

```
http://localhost:3000/api
```

### Endpoints Principais

| Método | Rota               | Descrição                                |
|--------|--------------------|-----------------------------------------|
| POST   | /invoices/upload   | Upload de uma fatura em PDF              |
| GET    | /invoices          | Listar todas as faturas processadas      |
| GET    | /invoices/:id      | Buscar uma fatura específica pelo ID     |

## 📁 Estrutura do Projeto

```
lumi-api/
├── src/
│   ├── config/             # Configurações da aplicação
│   ├── invoice/            # Módulo de faturas
│   │   ├── dto/            # Objetos de transferência de dados
│   │   ├── entities/       # Entidades do banco de dados
│   │   ├── invoice.controller.ts
│   │   ├── invoice.module.ts
│   │   └── invoice.service.ts
│   ├── migrations/         # Migrações do banco de dados
│   ├── parser/             # Serviço de processamento de PDF
│   ├── app.module.ts       # Módulo principal da aplicação
│   └── main.ts             # Ponto de entrada da aplicação
├── test/                   # Testes automatizados
├── docker-compose.yml      # Configuração Docker para produção
├── docker-compose.dev.yml  # Configuração Docker para desenvolvimento
├── Dockerfile              # Configuração de build do container
└── package.json            # Dependências e scripts
```

## 🧪 Testes

Para executar os testes:

```bash
# Testes unitários
pnpm test
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com ❤️ para a Lumi
</p>
