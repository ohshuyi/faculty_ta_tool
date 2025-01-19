const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Example: Create classe
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
