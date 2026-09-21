export function classifySyncFailure(error) {
  return [403, 404, 409, 422].includes(error?.status) ? 'needs-review' : 'pending';
}
