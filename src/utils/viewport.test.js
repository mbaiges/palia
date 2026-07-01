import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getVisualViewportBox, applyViewportBox } from './viewport.js';

describe('viewport', () => {
  it('caps height using layout and client viewport on Android-like metrics', () => {
    global.window = {
      innerHeight: 844,
      visualViewport: { height: 844, offsetTop: 0 },
    };
    global.document = {
      documentElement: { clientHeight: 788 },
    };

    assert.deepEqual(getVisualViewportBox(window.visualViewport), {
      height: 788,
      offsetTop: 0,
    });
  });

  it('applies offsetTop for iOS-like visual viewport shift', () => {
    global.window = {
      innerHeight: 844,
      visualViewport: { height: 788, offsetTop: 56 },
    };
    global.document = {
      documentElement: { clientHeight: 844 },
    };

    assert.deepEqual(getVisualViewportBox(window.visualViewport), {
      height: 788,
      offsetTop: 56,
    });
  });

  it('applyViewportBox writes CSS variables', () => {
    global.document = {
      documentElement: {
        style: {
          properties: {},
          setProperty(name, value) {
            this.properties[name] = value;
          },
        },
      },
    };

    applyViewportBox({ height: 688, offsetTop: 56 });

    assert.equal(document.documentElement.style.properties['--vvh'], '688px');
    assert.equal(document.documentElement.style.properties['--vv-offset-top'], '56px');
  });
});
