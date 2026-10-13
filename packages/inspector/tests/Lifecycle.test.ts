// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Scene, Node } from '@joroya/core';
import { Inspector } from '../src';
describe('inspector scene and DOM lifetime', () => {
  it('clears stale selection and releases the overlay across repeated attachments', () => {
    const scene = new Scene(); const node = new Node('selected'); scene.add(node);
    const inspector = new Inspector(scene);
    for (let i = 0; i < 100; i++) { inspector.attach(); inspector.attach(); expect(document.querySelectorAll('[data-oroya-inspector]')).toHaveLength(1); inspector.detach(); }
    inspector.attach(); inspector.setScene(new Scene()); expect(inspector.getSelected()).toBeNull(); inspector.detach(); inspector.detach();
    expect(document.querySelector('[data-oroya-inspector]')).toBeNull();
  });
});
