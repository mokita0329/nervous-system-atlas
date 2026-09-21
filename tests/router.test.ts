import { describe, expect, it } from 'vitest';
import { parseHash, serialize } from '../src/router/hashRouter.ts';

describe('hash router', () => {
  it('parses structure routes with slice params', () => {
    const { route, params } = parseHash('#/structure/putamen-l?ax=2&cor=4&sag=-24&c=t2w');
    expect(route).toEqual({ kind: 'structure', id: 'putamen-l' });
    expect(params).toEqual({ ax: 2, cor: 4, sag: -24, c: 't2w' });
  });
  it('carries a subject scan as the contrast, and drops anything else', () => {
    expect(parseHash('#/slice?c=subject-colin27').params.c).toBe('subject-colin27');
    expect(parseHash('#/slice?c=subject-../x').params.c).toBeUndefined();
    expect(parseHash('#/slice?c=flair').params.c).toBeUndefined();
    expect(serialize({ kind: 'slice' }, { c: 'subject-colin27' })).toBe('#/slice?c=subject-colin27');
  });
  it('keeps a pathway in the hash next to the slice params', () => {
    const h = serialize({ kind: 'pathway', id: 'pw-corticospinal' }, { ax: 12, c: 't2w' });
    expect(h).toBe('#/pathway/pw-corticospinal?ax=12&c=t2w');
    expect(parseHash(h)).toEqual({ route: { kind: 'pathway', id: 'pw-corticospinal' }, params: { ax: 12, cor: undefined, sag: undefined, c: 't2w' } });
  });
  it('round-trips a full view (camera, systems, overrides, slices, peels) and drops malformed ones', () => {
    const view = { cam: [-420.04, 0, 20, 0, -18.06, 10] as [number, number, number, number, number, number], sys: ['cerebrum', 'brainstem'], show: ['putamen-l'], hide: ['thalamus-r'], sl: 'ac', peel: 'ap,sn', pin: true };
    const h = serialize({ kind: 'structure', id: 'putamen-l' }, { ax: 2, ...view });
    expect(h).toBe('#/structure/putamen-l?ax=2&cam=-420,0,20,0,-18.1,10&sys=cerebrum,brainstem&show=putamen-l&hide=thalamus-r&sl=ac&peel=ap,sn&pin=1');
    const { params } = parseHash(h);
    expect(params.cam).toEqual([-420, 0, 20, 0, -18.1, 10]);
    expect(params.sys).toEqual(['cerebrum', 'brainstem']); expect(params.show).toEqual(['putamen-l']); expect(params.hide).toEqual(['thalamus-r']);
    expect(params.sl).toBe('ac'); expect(params.peel).toBe('ap,sn'); expect(params.pin).toBe(true);
    // an empty system list is "nothing on", which is different from no sys param at all
    expect(parseHash('#/slice?sys=').params.sys).toEqual([]);
    expect(parseHash('#/slice').params.sys).toBeUndefined();
    expect(parseHash('#/slice?sl=-').params.sl).toBe('-');
    const junk = parseHash('#/slice?cam=1,2,3&sl=xyz&peel=a&show=../x,ok-1&pin=yes').params;
    expect(junk.cam).toBeUndefined(); expect(junk.sl).toBeUndefined(); expect(junk.peel).toBeUndefined(); expect(junk.show).toEqual(['ok-1']); expect(junk.pin).toBeUndefined();
  });
  it('parses syndrome step and tolerates junk', () => {
    expect(parseHash('#/syndrome/syn-wallenberg-lateral-medullary?step=2&ax=abc').route).toEqual({ kind: 'syndrome', id: 'syn-wallenberg-lateral-medullary', step: 2 });
    expect(parseHash('').route).toEqual({ kind: 'home' });
    expect(parseHash('#/nonsense/x').route).toEqual({ kind: 'home' });
  });
  it('carries the interface language in the hash', () => {
    const { route, params } = parseHash('#/structure/brainstem?lang=tr');
    expect(route).toEqual({ kind: 'structure', id: 'brainstem' });
    expect(params.lang).toBe('tr');
    expect(parseHash('#/structure/brainstem?lang=ja').params.lang).toBe('ja');
    expect(parseHash('#/structure/brainstem?lang=de').params.lang).toBeUndefined();
    expect(parseHash('#/structure/brainstem').params.lang).toBeUndefined();
    const h = serialize({ kind: 'structure', id: 'brainstem' }, { lang: 'tr' });
    expect(h).toBe('#/structure/brainstem?lang=tr');
    expect(parseHash(h).params.lang).toBe('tr');
    // it survives next to the slice params, and English (the default) leaves no trace
    const both = serialize({ kind: 'syndrome', id: 'syn-x', step: 2 }, { ax: 10, c: 't2w', side: 'l', lang: 'tr' });
    expect(parseHash(both)).toEqual({ route: { kind: 'syndrome', id: 'syn-x', step: 2 }, params: { ax: 10, c: 't2w', side: 'l', lang: 'tr' } });
    expect(serialize({ kind: 'slice' }, {})).toBe('#/slice');
  });
  it('round-trips', () => {
    const h = serialize({ kind: 'structure', id: 'thalamus-r' }, { ax: 10, cor: -18, sag: 12 });
    expect(h).toBe('#/structure/thalamus-r?ax=10&cor=-18&sag=12');
    expect(parseHash(h).route).toEqual({ kind: 'structure', id: 'thalamus-r' });
  });
});
