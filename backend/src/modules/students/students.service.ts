import { Injectable } from '@nestjs/common';
import { StudentsRepository } from './students.repository';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsRepository: StudentsRepository,
  ) {}

  findByEmail(email: string) {
    return this.studentsRepository.findByEmail(email);
  }

  findById(id: number) {
    return this.studentsRepository.findById(id);
  }

  updateLastLogin(id: number) {
    return this.studentsRepository.updateLastLogin(id);
  }

  saveRefreshToken(
    studentId: number,
    token: string,
    expiresAt: Date,
  ) {
    return this.studentsRepository.saveRefreshToken(
      studentId,
      token,
      expiresAt,
    );
  }
}