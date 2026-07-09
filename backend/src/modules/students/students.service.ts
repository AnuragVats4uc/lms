import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StudentsRepository } from './students.repository';

type StudentRecord = NonNullable<
  Awaited<ReturnType<StudentsRepository['findById']>>
>;

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsRepository: StudentsRepository,
  ) {}

  findByEmail(email: string) {
    return this.studentsRepository.findByEmail(email);
  }

  findByMobile(mobile: string) {
    return this.studentsRepository.findByMobile(mobile);
  }

  findById(id: bigint | string) {
    return this.studentsRepository.findById(id);
  }

  async findPublicById(id: bigint | string) {
    const student = await this.studentsRepository.findById(id);

    return student ? this.toPublicStudent(student) : null;
  }

  updateLastLogin(id: bigint | string) {
    return this.studentsRepository.updateLastLogin(id);
  }

  saveRefreshToken(
    studentId: bigint | string,
    token: string,
    expiresAt: Date,
  ) {
    return this.studentsRepository.saveRefreshToken(
      studentId,
      token,
      expiresAt,
    );
  }

  create(data: Prisma.StudentsCreateInput) {
    return this.studentsRepository.create(data);
  }

  toPublicStudent(student: StudentRecord) {
    const { password: _password, profile, ...studentFields } = student;

    return {
      ...studentFields,
      id: student.id.toString(),
      profile: profile
        ? {
            ...profile,
            studentId: profile.studentId.toString(),
          }
        : null,
    };
  }
}
