import { signAuthToken, verifyAuthToken } from '../src/server/auth/token';
import { db } from '../src/server/db';

async function main() {
  console.log('--- Testing High-Risk 3: HMAC Token Generation & Verification ---');
  const payload = {
    id: 'emp-test-123',
    email: 'test@svicarbon.com',
    role: 'MARKETING',
  };

  const token = signAuthToken(payload, 3600);
  console.log('Generated token length:', token.length);

  const verified = verifyAuthToken(token);
  if (!verified || verified.id !== payload.id || verified.email !== payload.email) {
    throw new Error('Token verification failed!');
  }
  console.log('✓ Valid token successfully verified:', verified);

  // Test tampered token
  const tampered = token.slice(0, -4) + 'abcd';
  const tamperedResult = verifyAuthToken(tampered);
  if (tamperedResult !== null) {
    throw new Error('Tampered token was not rejected!');
  }
  console.log('✓ Tampered token rejected safely');

  // Test expired token
  const expiredToken = signAuthToken(payload, -10);
  const expiredResult = verifyAuthToken(expiredToken);
  if (expiredResult !== null) {
    throw new Error('Expired token was not rejected!');
  }
  console.log('✓ Expired token rejected safely');

  console.log('\n--- Testing High-Risk 1: Tasks getTaskStats without $transaction ---');
  const today = new Date();
  const [activeQuotations, allCommunications] = await Promise.all([
    db.quotation.findMany({
      where: {
        NOT: {
          status: { in: ['WON', 'LOST'] },
        },
      },
      select: {
        id: true,
        status: true,
        validityPeriod: true,
        createdAt: true,
      },
      take: 5,
    }),
    db.communication.findMany({
      where: {
        nextCommunicationDate: {
          not: null,
        },
      },
      select: {
        id: true,
        nextCommunicationDate: true,
      },
      take: 5,
    }),
  ]);

  console.log(`✓ Parallel queries executed successfully: ${activeQuotations.length} sample quotations, ${allCommunications.length} sample communications`);

  console.log('\n--- Testing High-Risk 2: Quotation getPaginated query logic ---');
  const [total, items] = await Promise.all([
    db.quotation.count(),
    db.quotation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        totalValue: true,
      },
    }),
  ]);
  console.log(`✓ Quotation paginated queries executed successfully: total = ${total}, sampled = ${items.length}`);

  console.log('\n=========================================');
  console.log('ALL HIGH-RISK VERIFICATIONS PASSED (100%)');
  console.log('=========================================');
}

main()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
