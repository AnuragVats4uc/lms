import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const existingAccount = await prisma.students.findFirst({
    where: {
      email: {
        not: null,
      },
      password: {
        not: null,
      },
    },
  });

  if (existingAccount) {
    console.log('Student auth account already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  const student = await prisma.students.create({
    data: {
      name: 'Anurag Mall',
      className: 'Test',
      gender: 'MALE',
      email: 'student@test.com',
      password: hashedPassword,
      firstName: 'Anurag',
      lastName: 'Mall',
      isActive: true,
      isVerified: true,
    },
  });

  console.log('Student auth account created');
  console.log(student);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
