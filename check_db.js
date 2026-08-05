const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.application.findMany().then(apps => console.log(JSON.stringify(apps, null, 2))).finally(() => prisma.$disconnect());
