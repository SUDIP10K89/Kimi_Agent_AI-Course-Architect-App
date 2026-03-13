import { afterEach, expect, jest, test } from '@jest/globals';

jest.unstable_mockModule('../src/modules/courses/course.repository.js', () => ({
  findById: jest.fn(),
}));

const courseRepository = await import('../src/modules/courses/course.repository.js');
const { ensureCourseOwnership, getCourseWithStatus } = await import('../src/modules/courses/course.service.js');

afterEach(() => {
  jest.restoreAllMocks();
});

test('ensureCourseOwnership allows the course owner', () => {
  expect(() => {
    ensureCourseOwnership({ createdBy: 'user-1' }, 'user-1');
  }).not.toThrow();
});

test('ensureCourseOwnership rejects a different user', () => {
  expect(() => ensureCourseOwnership({ createdBy: 'user-1' }, 'user-2')).toThrow('Forbidden');
});

test('getCourseWithStatus does not write on read and returns stored generation metadata', async () => {
  const updateLastAccessed = jest.fn();
  const course = {
    createdBy: 'user-1',
    modules: [
      {
        microTopics: [
          { content: { explanation: 'lesson' }, videos: [{ videoId: 'v1' }] },
          { content: null, videos: [] },
        ],
      },
    ],
    metadata: {
      generationFailed: false,
      generationFailedReason: null,
      generation: {
        status: 'interrupted',
        event: 'interrupted',
        progress: 50,
        message: 'Generation stopped before completion. Resume to continue.',
        updatedAt: new Date('2026-03-09T12:00:00.000Z'),
        error: null,
      },
    },
    updateLastAccessed,
    toObject() {
      return {
        createdBy: this.createdBy,
        progress: { percentage: 0 },
        metadata: this.metadata,
      };
    },
  };

  jest.spyOn(courseRepository, 'findById').mockResolvedValue(course);

  const result = await getCourseWithStatus('course-1');

  expect(updateLastAccessed).not.toHaveBeenCalled();
  expect(result.generationStatus).toMatchObject({
    isComplete: false,
    generatedCount: 1,
    totalCount: 2,
    percentage: 50,
    state: 'interrupted',
    interrupted: true,
    failed: false,
    message: 'Generation stopped before completion. Resume to continue.',
    lastEvent: 'interrupted',
  });
});
