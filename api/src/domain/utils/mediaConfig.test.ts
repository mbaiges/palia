import { isMediaEnabled } from './mediaConfig';

describe('isMediaEnabled', () => {
  afterEach(() => { delete process.env.MEDIA_ENABLED; });

  it.each(['false', '0', 'FALSE'])('disables the media routes for %s', (value) => {
    process.env.MEDIA_ENABLED = value;
    expect(isMediaEnabled()).toBe(false);
  });

  it('enables media by default', () => {
    expect(isMediaEnabled()).toBe(true);
  });
});
