const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Example: Create classes
  const class1 = await prisma.class.create({
    data: {
      courseCode: 'SC1015',
      classType: 'LAB',
      classGroup: 'A21',
      students: {
        create: [
          { student_code: 'CHUL6789', name: 'CHUA LI TING', prog: 'CSC3 FT' },
          { student_code: 'CHUX6789', name: 'CHUA XIN YI', prog: 'CSC3 FT' },
        ],
      },
    },
  });

  const class2 = await prisma.class.create({
    data: {
      courseCode: 'SC1015',
      classType: 'LAB',
      classGroup: 'A26',
      students: {
        create: [
          { student_code: 'BENST129', name: 'BENJAMIN SANTOS', prog: 'CSC3 FT' },
          { student_code: 'CHUJ6789', name: 'CHUA JIA LING', prog: 'CSC4 FT' },
        ],
      },
    },
  });

  console.log({ class1, class2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
