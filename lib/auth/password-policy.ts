export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

const LETTER_PATTERN = /[A-Za-z]/;
const NUMBER_PATTERN = /[0-9]/;

export function isStrongPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= MIN_PASSWORD_LENGTH &&
    value.length <= MAX_PASSWORD_LENGTH &&
    LETTER_PATTERN.test(value) &&
    NUMBER_PATTERN.test(value)
  );
}

export function isAcceptablePassword(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_PASSWORD_LENGTH;
}
