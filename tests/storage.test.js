/**
 * Tests für storage.js
 * Testet localStorage-Funktionen: save und load
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { saveData, loadData } from '../modules/storage.js';

describe('storage.js - localStorage Management', () => {
    const testEventId = 'test_rip26';
    const testData = {
        name: 'Max Mustermann',
        acts: ['Volbeat', 'Iron Maiden', 'The Offspring'],
        lastUpdated: 1234567890
    };

    beforeEach(() => {
        // Vor jedem Test: localStorage leeren
        localStorage.clear();
    });

    afterEach(() => {
        // Nach jedem Test: aufräumen
        localStorage.clear();
    });

    describe('saveData()', () => {
        it('sollte Daten in localStorage speichern', () => {
            saveData(testEventId, testData);
            const saved = localStorage.getItem(`fb_data_${testEventId}`);
            expect(saved).not.toBeNull();
            expect(JSON.parse(saved)).toEqual(testData);
        });

        it('sollte Fehler werfen wenn eventId fehlt', () => {
            expect(() => saveData(null, testData)).toThrow();
            expect(() => saveData('', testData)).toThrow();
        });

        it('sollte Fehler werfen wenn data fehlt', () => {
            expect(() => saveData(testEventId, null)).toThrow();
            expect(() => saveData(testEventId, undefined)).toThrow();
        });

        it('sollte mit leeren Acts-Array funktionieren', () => {
            const dataEmpty = { name: 'Test', acts: [], lastUpdated: 0 };
            saveData(testEventId, dataEmpty);
            const loaded = loadData(testEventId);
            expect(loaded.acts).toEqual([]);
        });

        it('sollte mit leerem Namen funktionieren', () => {
            const dataNoName = { name: '', acts: ['Volbeat'], lastUpdated: 0 };
            saveData(testEventId, dataNoName);
            const loaded = loadData(testEventId);
            expect(loaded.name).toBe('');
        });
    });

    describe('loadData()', () => {
        it('sollte null zurückgeben wenn keine Daten vorhanden sind', () => {
            const result = loadData(testEventId);
            expect(result).toBeNull();
        });

        it('sollte gespeicherte Daten korrekt laden', () => {
            saveData(testEventId, testData);
            const loaded = loadData(testEventId);
            expect(loaded).toEqual(testData);
        });

        it('sollte null zurückgeben wenn eventId fehlt', () => {
            expect(() => loadData(null)).toThrow();
            expect(() => loadData('')).toThrow();
        });

        it('sollte null zurückgeben bei korrupten Daten', () => {
            // Speichere ungültige Daten direkt
            localStorage.setItem('fb_data_corrupt', 'not-valid-json{');
            const result = loadData('corrupt');
            expect(result).toBeNull();
        });

        it('sollte null zurückgeben bei ungültiger Struktur', () => {
            // Speichere Daten ohne "acts" Array
            localStorage.setItem('fb_data_invalid', JSON.stringify({ name: 'Test' }));
            const result = loadData('invalid');
            expect(result).toBeNull();
        });

        it('sollte Daten mit vielen Acts laden', () => {
            const manyActs = {
                name: 'Festival Fan',
                acts: Array(50).fill('Act').map((a, i) => `${a} ${i}`),
                lastUpdated: 0
            };
            saveData(testEventId, manyActs);
            const loaded = loadData(testEventId);
            expect(loaded.acts.length).toBe(50);
        });
    });

    describe('Integration: Save + Load', () => {
        it('sollte Daten speichern und wiederladen können', () => {
            const originalData = { name: 'Anna', acts: ['Sabaton', 'Bad Omens'], lastUpdated: 9999 };
            saveData(testEventId, originalData);
            const loadedData = loadData(testEventId);
            expect(loadedData).toEqual(originalData);
        });

        it('sollte unterschiedliche Events separat speichern', () => {
            const data1 = { name: 'Plan 1', acts: ['Act1'], lastUpdated: 0 };
            const data2 = { name: 'Plan 2', acts: ['Act2'], lastUpdated: 0 };
            
            saveData('rip26', data1);
            saveData('rar26', data2);
            
            expect(loadData('rip26')).toEqual(data1);
            expect(loadData('rar26')).toEqual(data2);
        });
    });
});
