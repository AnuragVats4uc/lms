import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  const student = await prisma.students.create({
    data: {
      email: 'student@test.com',
      password: hashedPassword,
      firstName: 'Anurag',
      lastName: 'Mall',
      isActive: true,
      isVerified: true,
    },
  });

  console.log('Student created');
  console.log(student);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });