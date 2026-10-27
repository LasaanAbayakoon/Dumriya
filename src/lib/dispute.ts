/**
 * Payment dispute helper (card charged, no e-ticket). Pure functions only:
 * nothing here stores or sends anything. The text block is always English so
 * any support officer can read it.
 */
import { DISPUTE_TYPE_LABEL } from '@/config/policy';
import { formatDate } from './format';
import { isClockTime, isIsoDate } from './time';

export interface DisputeFields {
  name: string;
  mobile: string;
  location: string;
  paidDate: string;
  paidTime: string;
  reference: string;
  last4: string;
  email: string;
}

export type DisputeField = keyof DisputeFields;
export type DisputeError = 'required' | 'mobile' | 'email' | 'last4' | 'date';

export const EMPTY_DISPUTE: DisputeFields = {
  name: '',
  mobile: '',
  location: '',
  paidDate: '',
  paidTime: '',
  reference: '',
  last4: '',
  email: '',
};

/** Sri Lankan mobile: 07X XXX XXXX, optionally written +94 7X XXX XXXX. Spaces and dashes allowed. */
export function normalizeMobile(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, '');
  const m = /^(?:\+94|0094|94|0)?(7\d{8})$/.exec(s);
  return m ? `0${m[1]}` : null;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

/**
 * Card digits guard. Returns the accepted value, or `refused` when the input
 * contains more than 4 digits (a full or partial card number). The caller must
 * then keep the previous value: more than 4 digits are never stored, not even
 * truncated, because the first 4 of a card number are not the last 4.
 */
export function acceptLast4(input: string): { value: string } | { refused: true } {
  const digits = input.replace(/\D/g, '');
  if (digits.length > 4) return { refused: true };
  return { value: digits };
}

export function validateDispute(f: DisputeFields): Partial<Record<DisputeField, DisputeError>> {
  const errors: Partial<Record<DisputeField, DisputeError>> = {};
  for (const k of Object.keys(f) as DisputeField[]) if (f[k].trim() === '') errors[k] = 'required';
  if (f.mobile.trim() && !normalizeMobile(f.mobile)) errors.mobile = 'mobile';
  if (f.email.trim() && !isEmail(f.email)) errors.email = 'email';
  if (f.last4 && !/^\d{4}$/.test(f.last4)) errors.last4 = 'last4';
  if (f.paidDate && !isIsoDate(f.paidDate)) errors.paidDate = 'date';
  if (f.paidTime && !isClockTime(f.paidTime)) errors.paidTime = 'date';
  return errors;
}

/** The block the user pastes into Contact Us. Assumes the fields passed validation. */
export function buildDisputeText(f: DisputeFields): string {
  return [
    `Dispute type: ${DISPUTE_TYPE_LABEL}`,
    'Problem: my card was charged but I did not receive an e-ticket.',
    '',
    `Name: ${f.name.trim()}`,
    `Mobile: ${normalizeMobile(f.mobile) ?? f.mobile.trim()}`,
    `Location: ${f.location.trim()}`,
    `Date and time of payment: ${formatDate(f.paidDate, 'en')}, ${f.paidTime} (Sri Lanka time)`,
    `Reference number: ${f.reference.trim()}`,
    `Card used: last 4 digits ${f.last4}`,
    `Email used for the booking: ${f.email.trim()}`,
  ].join('\n');
}
