import 'reflect-metadata';

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ExamImportRowStatus, ExamImportScope } from '@prisma/client';
import * as XLSX from 'xlsx';

import { ExamImportMode } from '../src/modules/exam/dto/exam.dto';
import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

void test('Excel import template exposes topic and difficulty mapping contracts', () => {
  const service = new ExamService({} as ExamRepository);
  const workbook = XLSX.read(service.createExcelImportTemplate(), {
    type: 'buffer',
  });
  const mappingSheet = workbook.Sheets['Question Mapping'];
  assert.ok(mappingSheet, 'Question Mapping sheet is missing');

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mappingSheet);
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

  const instructionsSheet = workbook.Sheets.Instructions;
  assert.ok(instructionsSheet, 'Instructions sheet is missing');
  const instructions = XLSX.utils
    .sheet_to_json<unknown[]>(instructionsSheet, { header: 1 })
    .flat()
    .join(' ');
  assert.match(instructions, /optional topic_code/i);
  assert.match(instructions, /difficulty.*EASY.*MEDIUM.*HARD/i);
});

void test('code-free Excel template uses question numbers and contains no internal codes', () => {
  const service = new ExamService({} as ExamRepository);
  const workbook = XLSX.read(service.createCodelessExcelImportTemplate(), {
    type: 'buffer',
  });
  const mappingSheet = workbook.Sheets['Question Mapping'];
  assert.ok(mappingSheet, 'Question Mapping sheet is missing');

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mappingSheet);
  assert.equal(rows.length, 9);
  assert.deepEqual(Object.keys(rows[0]), [
    'question_number',
    'slot_code',
    'section_code',
    'subject_code',
    'topic_code',
    'question_type_id',
    'difficulty',
    'marks',
    'negative_marks',
    'sort_order',
    'is_mandatory',
  ]);
  assert.equal(Object.hasOwn(rows[0], 'question_code'), false);
  assert.equal(Object.hasOwn(rows[0], 'comprehension_code'), false);

  const instructions = XLSX.utils
    .sheet_to_json<unknown[]>(workbook.Sheets.Instructions, { header: 1 })
    .flat()
    .join(' ');
  assert.match(instructions, /slot_code \+ section_code \+ question_number/i);
  assert.match(instructions, /internal codes are generated/i);
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

void test('code-free Word and Excel templates merge into valid staged rows', async () => {
  const repository = {
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
  const service = new ExamService(repository);
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
