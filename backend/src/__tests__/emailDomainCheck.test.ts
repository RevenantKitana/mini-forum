import { describe, expect, it } from 'vitest';
import { buildSenderDomainHealthReport } from '../utils/emailDomainCheck.js';

describe('buildSenderDomainHealthReport', () => {
  it('returns no warnings when SPF, MX, and DMARC are configured', () => {
    const result = buildSenderDomainHealthReport('mio.io.vn', ['v=spf1 include:mailgun.org ~all'], [{ exchange: 'mail.example.com', priority: 10 }], ['v=DMARC1; p=quarantine; rua=mailto:d@ex.com']);

    expect(result.hasSpf).toBe(true);
    expect(result.hasMx).toBe(true);
    expect(result.hasDmarc).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('returns warnings when SPF, MX, or DMARC are missing', () => {
    const result = buildSenderDomainHealthReport('example.com', [], [], []);

    expect(result.hasSpf).toBe(false);
    expect(result.hasMx).toBe(false);
    expect(result.hasDmarc).toBe(false);
    expect(result.warnings).toContain('Sender domain example.com has no SPF record.');
    expect(result.warnings).toContain('Sender domain example.com has no MX record.');
    expect(result.warnings).toContain('Sender domain example.com has no DMARC record.');
  });
});
