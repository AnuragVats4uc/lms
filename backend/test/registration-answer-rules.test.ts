import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildRegistrationProfilePatch,
  normalizeRegistrationAnswers,
  RegistrationAnswerValidationError,
} from '../src/modules/registration/registration-answer.rules';

const fields = [
  {
    id: 10,
    fieldKey: 'home_city',
    fieldType: 'TEXT',
    isRequired: true,
    mapsTo: 'city',
    options: [],
  },
  {
    id: 11,
    fieldKey: 'study_language',
    fieldType: 'SELECT',
    isRequired: false,
    mapsTo: null,
    options: [{ optionKey: 'ENGLISH' }, { optionKey: 'HINDI' }],
  },
];

void test('normalizes configured answers and builds a safe profile patch', () => {
  const answers = normalizeRegistrationAnswers(fields, {
    home_city: '  Indore ',
    study_language: 'ENGLISH',
  });

  assert.deepEqual(answers, [
    {
      fieldId: 10,
      fieldKey: 'home_city',
      mapsTo: 'city',
      value: 'Indore',
    },
    {
      fieldId: 11,
      fieldKey: 'study_language',
      mapsTo: null,
      value: 'ENGLISH',
    },
  ]);
  assert.deepEqual(buildRegistrationProfilePatch(answers), {
    city: 'Indore',
  });
});

void test('rejects missing required and unknown answers', () => {
  assert.throws(
    () => normalizeRegistrationAnswers(fields, {}),
    (error: unknown) =>
      error instanceof RegistrationAnswerValidationError &&
      error.message === 'home_city is required',
  );
  assert.throws(
    () =>
      normalizeRegistrationAnswers(fields, {
        home_city: 'Indore',
        unconfigured_field: 'unexpected',
      }),
    (error: unknown) =>
      error instanceof RegistrationAnswerValidationError &&
      error.message === 'Unknown registration field: unconfigured_field',
  );
});

void test('rejects invalid select and radio option values', () => {
  assert.throws(
    () =>
      normalizeRegistrationAnswers(fields, {
        home_city: 'Indore',
        study_language: 'UNSUPPORTED',
      }),
    (error: unknown) =>
      error instanceof RegistrationAnswerValidationError &&
      error.message === 'study_language contains an invalid option',
  );
});

void test('omits optional blank answers so stale values can be cleared', () => {
  const answers = normalizeRegistrationAnswers(fields, {
    home_city: 'Indore',
    study_language: '   ',
  });

  assert.equal(answers.length, 1);
  assert.equal(answers[0]?.fieldKey, 'home_city');
});
