import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// Mock the Prisma client module so no real database is touched.
// Path resolves to src/server/db.ts (same module the router imports).
vi.mock('../../db', () => ({
  db: {
    quotation: { findMany: vi.fn() },
    communication: { findMany: vi.fn() },
    enquiry: { findMany: vi.fn() },
  },
}));

import { db } from '../../db';
import { tasksRouter } from './tasks';

// Loosely-typed handles for the mocked Prisma delegates (fixtures below are
// partial records; full Prisma payload types are not needed for these tests).
const mockedDb = vi.mocked(db, true) as unknown as {
  quotation: { findMany: Mock };
  communication: { findMany: Mock };
  enquiry: { findMany: Mock };
};

// Caller for invoking procedures without an HTTP layer.
const caller = tasksRouter.createCaller({} as never);

type CommFixture = {
  id: string;
  subject: string;
  description: string;
  type: string;
  status?: string;
  nextCommunicationDate: Date | null;
  createdAt: Date;
  proposedNextAction: string | null;
  enquiryId: number | null;
  enquiryRelated: string | null;
  company: { name: string; id: string } | null;
  customer: { name: string; id: string } | null;
  contact: { name: string; designation: string | null } | null;
};

const makeComm = (overrides: Partial<CommFixture>): CommFixture => ({
  id: overrides.id ?? crypto.randomUUID(),
  subject: 'Follow up',
  description: 'Discussion about requirements',
  type: 'EMAIL',
  nextCommunicationDate: new Date('2030-01-01T10:00:00Z'),
  createdAt: new Date('2026-08-01T10:00:00Z'),
  proposedNextAction: 'Send revised offer',
  enquiryId: null,
  enquiryRelated: null,
  company: { name: 'Acme Corp', id: 'company-1' },
  customer: null,
  contact: null,
  ...overrides,
});

const makeEnquiry = (id: number, quotationNumber: string) => ({
  id,
  quotationNumber,
  subject: `Enquiry ${id}`,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedDb.quotation.findMany.mockResolvedValue([]);
});

describe('tasks.getUpcoming enquiry resolution', () => {
  it('resolves a communication with a valid enquiryId', async () => {
    const comm = makeComm({ enquiryId: 7 });
    mockedDb.communication.findMany.mockResolvedValue([comm]);
    mockedDb.enquiry.findMany.mockResolvedValue([makeEnquiry(7, 'Q-007')]);

    const result = await caller.getUpcoming({});

    expect(result).toHaveLength(1);
    // Quotation number appears in the task description -> enquiry was attached
    expect(result[0].taskDescription).toContain('(Q#Q-007)');
    expect(mockedDb.enquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [7] } } })
    );
  });

  it('resolves a communication with a valid numeric legacy enquiryRelated', async () => {
    const comm = makeComm({ enquiryId: null, enquiryRelated: '42' });
    mockedDb.communication.findMany.mockResolvedValue([comm]);
    mockedDb.enquiry.findMany.mockResolvedValue([makeEnquiry(42, 'Q-042')]);

    const result = await caller.getUpcoming({});

    expect(result).toHaveLength(1);
    expect(result[0].taskDescription).toContain('(Q#Q-042)');
    expect(mockedDb.enquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [42] } } })
    );
  });

  it('resolves invalid enquiryRelated ("ENQ-123") to null and never passes it to Prisma', async () => {
    const comm = makeComm({ enquiryId: null, enquiryRelated: 'ENQ-123' });
    mockedDb.communication.findMany.mockResolvedValue([comm]);
    mockedDb.enquiry.findMany.mockResolvedValue([]);

    const result = await caller.getUpcoming({});

    expect(result).toHaveLength(1);
    expect(result[0].taskDescription).not.toContain('(Q#');
    // "ENQ-123" yields no valid numeric ID -> nothing to fetch, so the
    // batched query is skipped entirely and NaN never reaches Prisma
    expect(mockedDb.enquiry.findMany).not.toHaveBeenCalled();
  });

  it('never passes NaN to Prisma when mixed with valid IDs', async () => {
    const comms = [
      makeComm({ id: 'comm-valid', enquiryId: 11 }),
      makeComm({ id: 'comm-invalid', enquiryId: null, enquiryRelated: 'ENQ-123' }),
    ];
    mockedDb.communication.findMany.mockResolvedValue(comms);
    mockedDb.enquiry.findMany.mockResolvedValue([makeEnquiry(11, 'Q-011')]);

    const result = await caller.getUpcoming({});

    expect(result).toHaveLength(2);
    expect(mockedDb.enquiry.findMany).toHaveBeenCalledTimes(1);
    const callArg = mockedDb.enquiry.findMany.mock.calls[0][0] as {
      where: { id: { in: number[] } };
    };
    expect(callArg.where.id.in).toEqual([11]);
    expect(callArg.where.id.in).not.toContain(Number.NaN);
  });

  it('resolves an empty enquiryRelated to null', async () => {
    const comm = makeComm({ enquiryId: null, enquiryRelated: '' });
    mockedDb.communication.findMany.mockResolvedValue([comm]);
    mockedDb.enquiry.findMany.mockResolvedValue([]);

    const result = await caller.getUpcoming({});

    expect(result).toHaveLength(1);
    expect(result[0].taskDescription).not.toContain('(Q#');
    const callArg = mockedDb.enquiry.findMany.mock.calls[0]?.[0] as
      | { where: { id: { in: number[] } } }
      | undefined;
    // Empty string is falsy -> no IDs collected; batched query either skipped
    // or called with an empty ID list
    if (callArg) {
      expect(callArg.where.id.in).toEqual([]);
    }
  });

  it('deduplicates multiple communications referencing the same enquiry into one batched query', async () => {
    const comms = [
      makeComm({ id: 'comm-a', enquiryId: 5 }),
      makeComm({ id: 'comm-b', enquiryId: null, enquiryRelated: '5' }),
      makeComm({ id: 'comm-c', enquiryId: 5 }),
    ];
    mockedDb.communication.findMany.mockResolvedValue(comms);
    mockedDb.enquiry.findMany.mockResolvedValue([makeEnquiry(5, 'Q-005')]);

    const result = await caller.getUpcoming({});

    expect(result).toHaveLength(3);
    // Exactly ONE enquiry query, with the deduplicated ID list
    expect(mockedDb.enquiry.findMany).toHaveBeenCalledTimes(1);
    expect(mockedDb.enquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [5] } } })
    );
    // All three tasks show the attached quotation info
    for (const task of result) {
      expect(task.taskDescription).toContain('(Q#Q-005)');
    }
  });

  it('handles a communication with no enquiry reference without querying enquiries', async () => {
    const comm = makeComm({ enquiryId: null, enquiryRelated: null });
    mockedDb.communication.findMany.mockResolvedValue([comm]);

    const result = await caller.getUpcoming({});

    expect(result).toHaveLength(1);
    expect(result[0].taskDescription).not.toContain('(Q#');
    // No IDs to fetch -> the batched enquiry query is skipped entirely
    expect(mockedDb.enquiry.findMany).not.toHaveBeenCalled();
  });

  it('executes at most 3 database queries per getUpcoming request', async () => {
    const comms = [
      makeComm({ id: 'comm-1', enquiryId: 1 }),
      makeComm({ id: 'comm-2', enquiryId: 2 }),
      makeComm({ id: 'comm-3', enquiryId: null, enquiryRelated: '3' }),
      makeComm({ id: 'comm-4', enquiryId: null, enquiryRelated: 'bad-value' }),
    ];
    mockedDb.communication.findMany.mockResolvedValue(comms);
    mockedDb.enquiry.findMany.mockResolvedValue([
      makeEnquiry(1, 'Q-001'),
      makeEnquiry(2, 'Q-002'),
      makeEnquiry(3, 'Q-003'),
    ]);

    await caller.getUpcoming({});

    const totalQueries =
      mockedDb.quotation.findMany.mock.calls.length +
      mockedDb.communication.findMany.mock.calls.length +
      mockedDb.enquiry.findMany.mock.calls.length;

    // 1 quotation + 1 communication + 1 batched enquiry = 3 (was 2 + N before)
    expect(totalQueries).toBe(3);
  });

  it('preserves response ordering by due date and response shape', async () => {
    const comms = [
      makeComm({
        id: 'comm-late',
        enquiryId: 9,
        nextCommunicationDate: new Date('2030-06-01T10:00:00Z'),
      }),
      makeComm({
        id: 'comm-early',
        enquiryId: 8,
        nextCommunicationDate: new Date('2026-09-01T10:00:00Z'),
      }),
    ];
    mockedDb.communication.findMany.mockResolvedValue(comms);
    mockedDb.enquiry.findMany.mockResolvedValue([
      makeEnquiry(8, 'Q-008'),
      makeEnquiry(9, 'Q-009'),
    ]);

    const result = await caller.getUpcoming({});

    expect(result.map((t) => t.id)).toEqual(['comm-early', 'comm-late']);
    // Unified task shape preserved
    for (const task of result) {
      expect(task).toHaveProperty('type');
      expect(task).toHaveProperty('dueDate');
      expect(task).toHaveProperty('customerName');
      expect(task).toHaveProperty('taskDescription');
      expect(task).toHaveProperty('status');
      expect(task).toHaveProperty('link');
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('priority');
    }
  });
});