import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isSupportedTimeZone,
  normalizeReminderOffsets,
  studentProfileCompleteness,
} from '../src/modules/students/student-profile.rules';

test('profile completeness reports missing fields and a stable percentage', () => {
  const result = studentProfileCompleteness({
    firstName: 'Sam',
    lastName: 'Student',
    dateOfBirth: '2002-03-15',
    gender: 'Male',
    phone: '+919876543210',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    guardianName: 'Ramesh Student',
    guardianPhone: '+919123456789',
    emergencyContactName: '',
    emergencyContactPhone: null,
  });

  assert.equal(result.percentage, 83);
  assert.equal(result.completedFields, 10);
  assert.deepEqual(result.missingFields, [
    'emergencyContactName',
    'emergencyContactPhone',
  ]);
});

test('profile completeness treats blank strings and invalid dates as missing', () => {
  const result = studentProfileCompleteness({
    firstName: ' ',
    dateOfBirth: new Date('invalid'),
  });

  assert.equal(result.completedFields, 0);
  assert.equal(result.percentage, 0);
});

test('timezone validation accepts IANA zones and rejects unknown zones', () => {
  assert.equal(isSupportedTimeZone('Asia/Kolkata'), true);
  assert.equal(isSupportedTimeZone('UTC'), true);
  assert.equal(isSupportedTimeZone('Mars/Olympus'), false);
});

test('reminder offsets are unique and sorted from earliest notification', () => {
  assert.deepEqual(
    normalizeReminderOffsets([60, 1440, 60, 15]),
    [1440, 60, 15],
  );
});
