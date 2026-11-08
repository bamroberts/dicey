import { parseEmailProof } from '../../mobile/src/auth-input';
const project = 'https://dicey-test.supabase.co';
test('accepts numeric codes and same-project Supabase signup/magic links', () => {
  expect(parseEmailProof(' 123456 ', project)).toEqual({ token: '123456' });
  expect(parseEmailProof(`${project}/auth/v1/verify?token=0123456789abcdef0123456789&type=magiclink&redirect_to=https://other-app.example`, project)).toEqual({ token_hash: '0123456789abcdef0123456789' });
  expect(parseEmailProof(`${project}/auth/v1/verify?token_hash=0123456789abcdef0123456789&type=signup`, project)).toEqual({ token_hash: '0123456789abcdef0123456789' });
});
test.each([
 'https://wrong-project.supabase.co/auth/v1/verify?token=0123456789abcdef0123456789&type=magiclink',
 `${project}/unrelated?token=0123456789abcdef0123456789&type=magiclink`,
 `${project}/auth/v1/verify?token=0123456789abcdef0123456789&type=recovery`,
 `${project}/auth/v1/verify?token=short&type=magiclink`,
 'not a code or link',
])('rejects unrelated/malformed credential input %s', value => {
 expect(() => parseEmailProof(value, project)).toThrow();
});
