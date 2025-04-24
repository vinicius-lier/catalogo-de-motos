# Catálogo de Motos

Um catálogo digital para exibição e gerenciamento de motocicletas, desenvolvido com Next.js 14, Prisma e TypeScript.

## Funcionalidades

- ✨ Interface moderna e responsiva
- 📱 Visualização em carrossel das fotos das motos
- 🎨 Seleção de cores disponíveis
- 💰 Preços formatados em reais
- 🔍 Detalhes completos de cada moto
- 📝 Painel administrativo para gerenciamento
- 🖼️ Upload e gerenciamento de imagens
- 💾 Banco de dados com Prisma

## Tecnologias

- Next.js 14
- TypeScript
- Prisma
- TailwindCSS
- SQLite
- React Hook Form
- Sharp (processamento de imagens)

## Como executar

1. Clone o repositório:
```bash
git clone https://github.com/vinicius-lier/catalogo-de-motos.git
cd catalogo-de-motos
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
/app
  /api - Rotas da API
  /components - Componentes React
  /utils - Funções utilitárias
/prisma
  schema.prisma - Schema do banco de dados
/public
  /uploads - Imagens das motos
```

## Licença

MIT 