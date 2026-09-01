import 'reflect-metadata';

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExamImportRowStatus, ExamImportScope } from '@prisma/client';
import * as XLSX from 'xlsx';

import { ExamImportMode } from '../src/modules/exam/dto/exam.dto';
import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

function codelessImportRepository() {
  return {
    client: {
      examTemplateSlot: {
        findMany: () =>
          Promise.resolve([
            {
              id: 1,
              code: 'CUET_SLOT_1',
              name: 'Slot 1',
              sortOrder: 1,
              sections: [
                {
                  id: 11,
                  code: 'LANGUAGE',
                  name: 'English Language',
                  sortOrder: 1,
                  subjects: [
                    {
                      subjectId: 101,
                      subject: {
                        id: 101,
                        organizationId: 1,
                        code: 'ENGLISH',
                        name: 'English',
                      },
                    },
                  ],
                },
                {
                  id: 12,
                  code: 'QUANT',
                  name: 'Quantitative Aptitude',
                  sortOrder: 2,
                  subjects: [
                    {
                      subjectId: 102,
                      subject: {
                        id: 102,
                        organizationId: 1,
                        code: 'MATHEMATICS',
                        name: 'Mathematics',
                      },
                    },
                  ],
                },
              ],
            },
          ]),
      },
    },
  } as unknown as ExamRepository;
}

void test('Excel import template uses one sheet and question type codes', () => {
  const service = new ExamService({} as ExamRepository);
  const workbook = XLSX.read(service.createExcelImportTemplate(), {
    type: 'buffer',
  });
  assert.deepEqual(workbook.SheetNames, ['Question Mapping']);
  const mappingSheet = workbook.Sheets['Question Mapping'];
  assert.ok(mappingSheet, 'Question Mapping sheet is missing');

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mappingSheet, {
    range: 'A1:K6',
  });
  assert.ok(rows.length > 0, 'Question Mapping examples are missing');
  assert.ok(
    Object.hasOwn(rows[0], 'topic_code'),
    'topic_code column is missing from the mapping template',
  );
  assert.ok(
    rows.every((row) => typeof row.topic_code === 'string'),
    'example rows should demonstrate valid topic codes',
  );
  assert.ok(
    Object.hasOwn(rows[0], 'difficulty'),
    'difficulty column is missing from the mapping template',
  );
  assert.deepEqual(
    new Set(rows.map((row) => row.difficulty)),
    new Set(['EASY', 'MEDIUM', 'HARD']),
    'examples should demonstrate every supported difficulty',
  );
  assert.ok(Object.hasOwn(rows[0], 'question_type_code'));
  assert.equal(Object.hasOwn(rows[0], 'question_type_id'), false);
  assert.equal(Object.hasOwn(rows[0], 'is_mandatory'), false);

  const questionTypes = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    mappingSheet,
    { range: 'M1:O6' },
  );
  assert.deepEqual(
    questionTypes.map((row) => row['Production code']),
    ['SINGLE_CHOICE', 'NUMERIC', 'ONE_WORD', 'MULTIPLE_CHOICE', 'SUBJECTIVE'],
  );
  const difficulties = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    mappingSheet,
    { range: 'Q1:R4' },
  );
  assert.deepEqual(
    difficulties.map((row) => row['Difficulty code']),
    ['EASY', 'MEDIUM', 'HARD'],
  );
  const instructions = XLSX.utils
    .sheet_to_json<unknown[]>(mappingSheet, { header: 1, range: 'T1:U6' })
    .flat()
    .join(' ');
  assert.match(instructions, /question_type_code/i);
  assert.match(instructions, /one worksheet/i);
});

void test('code-free Excel template uses question numbers and contains no internal codes', () => {
  const service = new ExamService({} as ExamRepository);
  const workbook = XLSX.read(service.createCodelessExcelImportTemplate(), {
    type: 'buffer',
  });
  assert.deepEqual(workbook.SheetNames, ['Question Mapping']);
  const mappingSheet = workbook.Sheets['Question Mapping'];
  assert.ok(mappingSheet, 'Question Mapping sheet is missing');

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mappingSheet, {
    range: 'A1:J10',
  });
  assert.equal(rows.length, 9);
  assert.deepEqual(Object.keys(rows[0]), [
    'question_number',
    'slot_code',
    'section_code',
    'subject_code',
    'topic_code',
    'question_type_code',
    'difficulty',
    'marks',
    'negative_marks',
    'sort_order',
  ]);
  assert.equal(Object.hasOwn(rows[0], 'question_code'), false);
  assert.equal(Object.hasOwn(rows[0], 'comprehension_code'), false);

  const instructions = XLSX.utils
    .sheet_to_json<unknown[]>(mappingSheet, {
      header: 1,
      range: 'T1:U6',
    })
    .flat()
    .join(' ');
  assert.match(instructions, /slot_code \+ section_code \+ question_number/i);
  assert.match(instructions, /internal codes are generated/i);
  assert.match(instructions, /one worksheet/i);
});

void test('code-free Word template parses paragraph options and one-time shared ranges', async () => {
  const service = new ExamService({} as ExamRepository);
  const wordBuffer = service.createCodelessWordImportTemplate();
  assert.equal(
    wordBuffer.includes(Buffer.from('<w:tbl>')),
    false,
    'code-free Word template must not contain tables',
  );

  const internal = service as unknown as {
    parseCodelessWordContent: (buffer: Buffer) => Promise<
      Array<{
        questionNumber: number;
        questionLabel: string;
        comprehensionKind?: string;
        comprehensionRangeStart?: number;
        comprehensionRangeEnd?: number;
        comprehensionContent?: string;
        questionContent: string;
        answerRulesContent?: string;
        explanation?: string;
        options: Array<{ code: string; content: string; isCorrect: boolean }>;
      }>
    >;
  };
  const rows = await internal.parseCodelessWordContent(wordBuffer);

  assert.equal(rows.length, 9);
  assert.equal(rows[0].questionLabel, 'Q1.');
  assert.equal(rows[0].comprehensionKind, 'COMPREHENSION');
  assert.equal(rows[0].comprehensionRangeStart, 1);
  assert.equal(rows[0].comprehensionRangeEnd, 5);
  assert.equal(rows[4].comprehensionContent, rows[0].comprehensionContent);
  assert.equal(rows[5].comprehensionKind, 'DIRECTIONS');
  assert.equal(rows[5].comprehensionRangeStart, 6);
  assert.equal(rows[6].comprehensionRangeEnd, 7);
  assert.equal(rows[7].comprehensionKind, undefined);
  assert.deepEqual(
    rows[0].options.map((option) => option.code),
    ['A', 'B', 'C', 'D'],
  );
  assert.equal(rows[0].options[0].isCorrect, true);
  assert.match(rows[0].comprehensionContent ?? '', /<img\b/i);
  assert.match(rows[0].questionContent, /<img\b/i);
  assert.match(rows[0].options[3].content, /<img\b/i);
  assert.match(rows[0].answerRulesContent ?? '', /<img\b/i);
  assert.match(rows[0].explanation ?? '', /<img\b/i);
  assert.match(rows[5].questionContent, /<img\b/i);
});

void test('paired Word and Excel templates merge into valid staged rows by question type code', async () => {
  const service = new ExamService({} as ExamRepository);
  const internal = service as unknown as {
    parseWordContent: (buffer: Buffer) => Promise<unknown[]>;
    parseWorkbookMappings: (buffer: Buffer) => unknown[];
    mergeImportFiles: (
      wordRows: unknown[],
      excelRows: unknown[],
      questionTypes: Array<{ id: number; code: string; isActive: boolean }>,
    ) => Array<{
      status: ExamImportRowStatus;
      questionTypeId?: number;
      validationMessage?: string;
    }>;
  };
  const rows = internal.mergeImportFiles(
    await internal.parseWordContent(service.createWordImportTemplate()),
    internal.parseWorkbookMappings(service.createExcelImportTemplate()),
    [
      { id: 1, code: 'SINGLE_CHOICE', isActive: true },
      { id: 2, code: 'NUMERIC', isActive: true },
      { id: 3, code: 'ONE_WORD', isActive: true },
    ],
  );

  assert.equal(rows.length, 5);
  assert.ok(
    rows.every((row) => row.status === ExamImportRowStatus.VALID),
    JSON.stringify(rows, null, 2),
  );
  assert.deepEqual(
    new Set(rows.map((row) => row.questionTypeId)),
    new Set([1, 2, 3]),
  );
});

void test('code-free Word and Excel templates merge into valid staged rows', async () => {
  const service = new ExamService(codelessImportRepository());
  const internal = service as unknown as {
    parseCodelessWorkbookMappings: (buffer: Buffer) => unknown[];
    buildCodelessWordRows: (
      word: Buffer,
      mappings: unknown[],
      versionId: number,
      dto: {
        scope: ExamImportScope;
        importMode: ExamImportMode;
        examTemplateVersionId: number;
      },
      questionTypes: Array<{ id: number; code: string; name: string }>,
    ) => Promise<
      Array<{
        status: ExamImportRowStatus;
        questionCode: string;
        comprehensionCode?: string;
        rawData: Record<string, unknown>;
      }>
    >;
  };
  const excelBuffer = service.createCodelessExcelImportTemplate();
  const mappings = internal.parseCodelessWorkbookMappings(excelBuffer);
  const rows = await internal.buildCodelessWordRows(
    service.createCodelessWordImportTemplate(),
    mappings,
    77,
    {
      scope: ExamImportScope.FULL_EXAM,
      importMode: ExamImportMode.CODELESS_WORD,
      examTemplateVersionId: 77,
    },
    [
      { id: 1, code: 'SINGLE_CHOICE', name: 'Single Answer' },
      { id: 2, code: 'NUMERIC', name: 'Numeric Answer' },
      { id: 3, code: 'ONE_WORD', name: 'One Word Answer' },
    ],
  );

  assert.equal(rows.length, 9);
  assert.ok(
    rows.every((row) => row.status === ExamImportRowStatus.VALID),
    JSON.stringify(rows, null, 2),
  );
  assert.equal(new Set(rows.map((row) => row.questionCode)).size, rows.length);
  assert.equal(rows[0].comprehensionCode, rows[4].comprehensionCode);
  assert.equal(rows[5].comprehensionCode, rows[6].comprehensionCode);
  assert.notEqual(rows[0].comprehensionCode, rows[5].comprehensionCode);
});

void test('code-free import explains invalid, unavailable, and legacy question types', async () => {
  const service = new ExamService(codelessImportRepository());
  const internal = service as unknown as {
    parseCodelessWorkbookMappings: (buffer: Buffer) => unknown[];
    buildCodelessWordRows: (
      word: Buffer,
      mappings: unknown[],
      versionId: number,
      dto: {
        scope: ExamImportScope;
        importMode: ExamImportMode;
        examTemplateVersionId: number;
      },
      questionTypes: Array<{
        id: number;
        code: string;
        isActive: boolean;
      }>,
    ) => Promise<
      Array<{
        sourceRowNumber: number;
        status: ExamImportRowStatus;
        validationMessage?: string;
      }>
    >;
  };
  const questionTypes = [
    { id: 1, code: 'SINGLE_CHOICE', isActive: true },
    { id: 2, code: 'NUMERIC', isActive: true },
    { id: 3, code: 'ONE_WORD', isActive: true },
    { id: 4, code: 'MULTIPLE_CHOICE', isActive: false },
    { id: 5, code: 'SUBJECTIVE', isActive: false },
  ];
  const run = async (header: string, value: string | number) => {
    const workbook = XLSX.read(service.createCodelessExcelImportTemplate(), {
      type: 'buffer',
    });
    const sheet = workbook.Sheets['Question Mapping'];
    sheet.F1 = { t: 's', v: header };
    sheet.F2 =
      typeof value === 'number' ? { t: 'n', v: value } : { t: 's', v: value };
    const mappings = internal.parseCodelessWorkbookMappings(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer,
    );
    const rows = await internal.buildCodelessWordRows(
      service.createCodelessWordImportTemplate(),
      mappings,
      77,
      {
        scope: ExamImportScope.FULL_EXAM,
        importMode: ExamImportMode.CODELESS_WORD,
        examTemplateVersionId: 77,
      },
      questionTypes,
    );
    return rows.find((row) => row.sourceRowNumber === 2)!;
  };

  const unknown = await run('question_type_code', 'WRONG_CODE');
  assert.equal(unknown.status, ExamImportRowStatus.ERROR);
  assert.match(unknown.validationMessage ?? '', /Import row 2:/);
  assert.match(unknown.validationMessage ?? '', /not recognized/i);

  const unavailable = await run('question_type_code', 'MULTIPLE_CHOICE');
  assert.match(
    unavailable.validationMessage ?? '',
    /not available for import/i,
  );

  const legacy = await run('question_type_id', 1);
  assert.match(legacy.validationMessage ?? '', /old question_type_id column/i);

  for (const row of [unknown, unavailable, legacy]) {
    assert.doesNotMatch(
      row.validationMessage ?? '',
      /status code|\b400\b|\b422\b/i,
    );
  }
});
