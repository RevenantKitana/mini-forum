import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface SenderDomainHealthReport {
  domain: string;
  hasSpf: boolean;
  hasMx: boolean;
  hasDmarc: boolean;
  warnings: string[];
}

export function buildSenderDomainHealthReport(
  domain: string,
  spfRecords: Array<string | { value: string }> = [],
  mxRecords: Array<{ exchange: string; priority?: number }> = [],
  dmarcRecords: Array<string | { value: string }> = []
): SenderDomainHealthReport {
  const warnings: string[] = [];

  const hasSpf = spfRecords.some((record) => {
    const value = typeof record === 'string' ? record : record.value;
    return typeof value === 'string' && value.toLowerCase().includes('v=spf1');
  });

  const hasMx = mxRecords.length > 0;
  const hasDmarc = dmarcRecords.some((record) => {
    const value = typeof record === 'string' ? record : record.value;
    return typeof value === 'string' && value.toLowerCase().includes('v=dmarc1');
  });

  if (!hasSpf) warnings.push(`Sender domain ${domain} has no SPF record.`);
  if (!hasMx) warnings.push(`Sender domain ${domain} has no MX record.`);
  if (!hasDmarc) warnings.push(`Sender domain ${domain} has no DMARC record.`);

  return { domain, hasSpf, hasMx, hasDmarc, warnings };
}

export async function getSenderDomainHealthReport(domain: string): Promise<SenderDomainHealthReport> {
  const warnings: string[] = [];

  try {
    const { stdout } = await execFileAsync('nslookup', ['-type=txt', domain], { windowsHide: true });
    const text = stdout.toString();
    const hasSpf = /v=spf1/i.test(text);
    if (!hasSpf) warnings.push(`Sender domain ${domain} has no SPF record.`);
  } catch {
    warnings.push(`Sender domain ${domain} has no SPF record.`);
  }

  try {
    const { stdout } = await execFileAsync('nslookup', ['-type=mx', domain], { windowsHide: true });
    const text = stdout.toString();
    const hasMx = /exchange\s*=|mail exchanger/i.test(text);
    if (!hasMx) warnings.push(`Sender domain ${domain} has no MX record.`);
  } catch {
    warnings.push(`Sender domain ${domain} has no MX record.`);
  }

  try {
    const dmarcDomain = `_${domain}`.startsWith('_') ? `_${domain}` : `_${domain}`;
    const { stdout } = await execFileAsync('nslookup', ['-type=txt', `_${domain}`], { windowsHide: true });
    const text = stdout.toString();
    const hasDmarc = /v=dmarc1/i.test(text);
    if (!hasDmarc) warnings.push(`Sender domain ${domain} has no DMARC record.`);
  } catch {
    warnings.push(`Sender domain ${domain} has no DMARC record.`);
  }

  return {
    domain,
    hasSpf: !warnings.some((warning) => warning.includes('SPF')),
    hasMx: !warnings.some((warning) => warning.includes('MX')),
    hasDmarc: !warnings.some((warning) => warning.includes('DMARC')),
    warnings,
  };
}
