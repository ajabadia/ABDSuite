import { describe, it, expect } from 'vitest';
import { getContrastColor, adjustColor, hexToHslComponents } from './color-utils.js';

describe('color-utils', () => {
  describe('getContrastColor', () => {
    it('returns white for dark colors', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff');
      expect(getContrastColor('#1e293b')).toBe('#ffffff');
      expect(getContrastColor('#b91c1c')).toBe('#ffffff'); // Red
    });

    it('returns black for light colors', () => {
      expect(getContrastColor('#ffffff')).toBe('#000000');
      expect(getContrastColor('#f8fafc')).toBe('#000000');
      expect(getContrastColor('#fef08a')).toBe('#000000'); // Yellow
    });

    it('handles 3 character hex codes', () => {
      expect(getContrastColor('#000')).toBe('#ffffff');
      expect(getContrastColor('#fff')).toBe('#000000');
      expect(getContrastColor('#F00')).toBe('#ffffff');
    });

    it('returns white on invalid input', () => {
      expect(getContrastColor('')).toBe('#ffffff');
      expect(getContrastColor('invalid')).toBe('#ffffff');
    });
  });

  describe('adjustColor', () => {
    it('lightens a color correctly', () => {
      expect(adjustColor('#3b82f6', 15)).toBe('#61a8ff');
    });

    it('darkens a color correctly', () => {
      expect(adjustColor('#3b82f6', -15)).toBe('#155cd0');
    });

    it('handles 3 character hex codes', () => {
      expect(adjustColor('#F00', -15)).toBe('#d90000'); // F00 is FF0000, darker is D90000
    });

    it('caps percent limits', () => {
      // More than 100 or less than -100 returns the original
      expect(adjustColor('#3b82f6', 101)).toBe('#3b82f6');
      expect(adjustColor('#3b82f6', -105)).toBe('#3b82f6');
    });

    it('handles boundary colors without overflowing', () => {
      expect(adjustColor('#ffffff', 20)).toBe('#ffffff'); // Cannot lighten white
      expect(adjustColor('#000000', -20)).toBe('#000000'); // Cannot darken black
    });
  });

  describe('hexToHslComponents', () => {
    it('converts standard hex correctly', () => {
      expect(hexToHslComponents('#ff0000')).toBe('0 100% 50%');
      expect(hexToHslComponents('#00ff00')).toBe('120 100% 50%');
      expect(hexToHslComponents('#0000ff')).toBe('240 100% 50%');
    });

    it('handles 3 character hex correctly', () => {
      expect(hexToHslComponents('#f00')).toBe('0 100% 50%');
      expect(hexToHslComponents('#fff')).toBe('0 0% 100%');
    });
  });
});
