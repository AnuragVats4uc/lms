import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ObjectKeyBuilder } from '../src/modules/storage/object-key.builder';

const builder = new ObjectKeyBuilder();

void test('builds tenant object keys with readable numeric IDs and UUIDs', () => {
  const key = builder.build({
    organization: {
      id: 12,
      uuid: 'A1111111-B222-4CCC-8DDD-E55555555555',
    },
    owner: {
      category: 'exam-imports',
      id: 34,
      uuid: 'F1111111-A222-4BBB-8CCC-D55555555555',
    },
    asset: {
      id: 56,
      uuid: 'B1111111-C222-4DDD-8EEE-F55555555555',
    },
    originalFileName: 'Final Question Mapping (August).XLSX',
  });

  assert.equal(
    key,
    'organizations/12/a1111111-b222-4ccc-8ddd-e55555555555/' +
      'exam-imports/34/f1111111-a222-4bbb-8ccc-d55555555555/' +
      'assets/56/b1111111-c222-4ddd-8eee-f55555555555/' +
      'final-question-mapping-august.xlsx',
  );
});

void test('removes path traversal and unsupported filename characters', () => {
  const key = builder.build({
    organization: null,
    owner: {
      category: 'resources',
      id: 9,
      uuid: '11111111-2222-4333-8444-555555555555',
    },
    asset: {
      id: 10,
      uuid: '66666666-7777-4888-8999-000000000000',
    },
    originalFileName: '../../Unsafe résumé?.PDF',
  });

  assert.equal(
    key,
    'global/resources/9/11111111-2222-4333-8444-555555555555/' +
      'assets/10/66666666-7777-4888-8999-000000000000/unsafe-re-sume.pdf',
  );
  assert.equal(key.includes('..'), false);
});

void test('rejects unsafe UUID or identifier segments', () => {
  assert.throws(
    () =>
      builder.build({
        organization: { id: 1, uuid: '../tenant' },
        owner: {
          category: 'resources',
          id: 2,
          uuid: '11111111-2222-4333-8444-555555555555',
        },
        asset: {
          id: 3,
          uuid: '66666666-7777-4888-8999-000000000000',
        },
        originalFileName: 'notes.pdf',
      }),
    /unsupported characters/,
  );
});
