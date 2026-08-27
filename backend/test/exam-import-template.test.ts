import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as XLSX from 'xlsx';

import { ExamRepository } from '../src/modules/exam/repositories/exam.repository';
import { ExamService } from '../src/modules/exam/services/exam.service';

void test('Excel import template exposes the optional topic mapping contract', () => {
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

  const instructionsSheet = workbook.Sheets.Instructions;
  assert.ok(instructionsSheet, 'Instructions sheet is missing');
  const instructions = XLSX.utils
    .sheet_to_json<unknown[]>(instructionsSheet, { header: 1 })
    .flat()
    .join(' ');
  assert.match(instructions, /optional topic_code/i);
});
