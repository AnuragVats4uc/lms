import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExamImportRowStatus, ExamImportScope } from '@prisma/client';

import { CreateExamImportDto } from '../src/modules/exam/dto/exam.dto';
import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

type ValidationRow = {
  sourceRowNumber: number;
  slotCode?: string;
  sectionCode?: string;
  subjectCode?: string;
  questionCode: string;
  questionTypeId?: number;
  rawQuestionTypeId?: number;
  comprehensionCode?: string;
  comprehensionContent?: string;
  questionContent: string;
  marks: number;
  negativeMarks: number;
  sortOrder?: number;
  isMandatory: boolean;
  answer?: string;
  tolerance?: number;
  caseSensitive: boolean;
  explanation?: string;
  options: Array<{ code: string; content: string; isCorrect: boolean }>;
  acceptedAnswers: string[];
  status: ExamImportRowStatus;
  validationMessage?: string;
  rawData: Record<string, unknown>;
};

type TestableExamService = {
  validateImportDestinations(
    versionId: number,
    organizationId: number,
    dto: CreateExamImportDto,
    rows: ValidationRow[],
  ): Promise<void>;
  importFingerprint(input: {
    organizationId: number;
    examTemplateVersionId: number;
    scope: ExamImportScope;
    examTemplateSlotId?: number;
    examTemplateSectionId?: number;
    subjectId?: number;
    wordFileHash: string;
    excelFileHash: string;
  }): string;
};

const organizationId = 7;
const englishSubject = {
  id: 11,
  organizationId,
  code: 'ENGLISH',
  name: 'English Language',
  isActive: true,
};

function serviceWith(
  existingQuestions: Array<{ code: string; subjectId: number }> = [],
) {
  const client = {
    examTemplateSlot: {
      findMany: () =>
        Promise.resolve([
          {
            id: 21,
            code: 'CUET_SLOT_1',
            sections: [
              {
                id: 31,
                code: 'LANGUAGE',
                subjects: [{ subject: englishSubject }],
              },
            ],
          },
        ]),
    },
    subject: { findMany: () => Promise.resolve([englishSubject]) },
    topic: { findMany: () => Promise.resolve([]) },
    question: { findMany: () => Promise.resolve(existingQuestions) },
  };
  return new ExamService({
    client,
  } as unknown as ExamRepository) as unknown as TestableExamService;
}

function stagedRow(overrides: Partial<ValidationRow> = {}): ValidationRow {
  return {
    sourceRowNumber: 1,
    slotCode: 'CUET_SLOT_1',
    sectionCode: 'LANGUAGE',
    subjectCode: 'ENGLISH',
    questionCode: 'ENG-NEW-001',
    questionTypeId: 1,
    rawQuestionTypeId: 1,
    questionContent: 'Choose the grammatically correct sentence.',
    marks: 5,
    negativeMarks: 1,
    isMandatory: true,
    caseSensitive: false,
    options: [],
    acceptedAnswers: [],
    status: ExamImportRowStatus.VALID,
    rawData: {},
    ...overrides,
  };
}

function singleSectionDto(): CreateExamImportDto {
  return {
    examTemplateVersionId: 5,
    scope: ExamImportScope.SINGLE_SECTION,
    examTemplateSlotId: 21,
    examTemplateSectionId: 31,
    subjectId: 11,
  };
}

void test('accepts rows whose mapping matches the selected section', async () => {
  const rows = [stagedRow()];
  await serviceWith().validateImportDestinations(
    5,
    organizationId,
    singleSectionDto(),
    rows,
  );
  assert.equal(rows[0].status, ExamImportRowStatus.VALID);
  assert.equal(rows[0].validationMessage, undefined);
});

void test('rejects a Quant mapping uploaded into the English section', async () => {
  const rows = [
    stagedRow({ sectionCode: 'QUANT', subjectCode: 'QUANTITATIVE' }),
  ];
  await serviceWith().validateImportDestinations(
    5,
    organizationId,
    singleSectionDto(),
    rows,
  );
  assert.equal(rows[0].status, ExamImportRowStatus.ERROR);
  assert.match(rows[0].validationMessage ?? '', /Use section_code "LANGUAGE"/);
  assert.match(rows[0].validationMessage ?? '', /Use subject_code "ENGLISH"/);
});

void test('rejects a question code that already exists in the question bank', async () => {
  const rows = [stagedRow()];
  await serviceWith([
    { code: 'ENG-NEW-001', subjectId: 11 },
  ]).validateImportDestinations(5, organizationId, singleSectionDto(), rows);
  assert.equal(rows[0].status, ExamImportRowStatus.ERROR);
  assert.match(
    rows[0].validationMessage ?? '',
    /already exists in the question bank/,
  );
});

void test('fingerprint changes when the import destination changes', () => {
  const service = serviceWith();
  const input = {
    organizationId,
    examTemplateVersionId: 5,
    scope: ExamImportScope.SINGLE_SECTION,
    examTemplateSlotId: 21,
    examTemplateSectionId: 31,
    subjectId: 11,
    wordFileHash: 'word-hash',
    excelFileHash: 'excel-hash',
  };
  const first = service.importFingerprint(input);
  assert.equal(first, service.importFingerprint(input));
  assert.notEqual(
    first,
    service.importFingerprint({ ...input, examTemplateSectionId: 32 }),
  );
});
