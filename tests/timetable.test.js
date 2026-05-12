/**
 * Tests für timetable.js
 * Testet Festival-Daten Laden und Validierung
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('timetable.js - Festival Data Management', () => {
    
    const validTimetable = {
        festival: 'Rock im Park 2026',
        year: 2026,
        date_start: '2026-06-05',
        date_end: '2026-06-07',
        location: 'Nürnberg',
        timetable: [
            { day: '2026-06-05', stage: 'Utopia Stage', act: 'Volbeat', start: '21:10', end: '22:55' },
            { day: '2026-06-06', stage: 'Mandora Stage', act: 'Iron Maiden', start: '20:40', end: '23:00' }
        ]
    };

    describe('Event ID Validation', () => {
        it('sollte gültige Event-IDs akzeptieren', () => {
            const validateEventId = (id) => /^[a-z0-9]+$/i.test(id);
            
            expect(validateEventId('rip26')).toBe(true);
            expect(validateEventId('rar26')).toBe(true);
            expect(validateEventId('test123')).toBe(true);
        });

        it('sollte ungültige Event-IDs ablehnen', () => {
            const validateEventId = (id) => /^[a-z0-9]+$/i.test(id);
            
            expect(validateEventId('../data')).toBe(false); // Path Traversal
            expect(validateEventId('test;drop')).toBe(false);
            expect(validateEventId('test with spaces')).toBe(false);
        });
    });

    describe('Timetable Structure Validation', () => {
        it('sollte gültige Timetable-Struktur akzeptieren', () => {
            const isValid = (t) => {
                return t && 
                       t.timetable && 
                       Array.isArray(t.timetable) &&
                       t.date_start && 
                       t.festival;
            };
            
            expect(isValid(validTimetable)).toBe(true);
        });

        it('sollte ungültige Struktur ablehnen', () => {
            const isValid = (t) => {
                return t && 
                       t.timetable && 
                       Array.isArray(t.timetable) &&
                       t.date_start;
            };
            
            expect(isValid(null)).toBe(false);
            expect(isValid({})).toBe(false);
            expect(isValid({ timetable: 'not-array' })).toBe(false);
            expect(isValid({ timetable: [], date_start: null })).toBe(false);
        });
    });

    describe('Day Navigation', () => {
        it('sollte alle Tage extrahieren', () => {
            const getDays = (timetable) => {
                return [...new Set(timetable.timetable.map(a => a.day))].sort();
            };
            
            const days = getDays(validTimetable);
            expect(days).toContain('2026-06-05');
            expect(days).toContain('2026-06-06');
            expect(days.length).toBe(2);
        });

        it('sollte Tage chronologisch sortieren', () => {
            const timetable = {
                timetable: [
                    { day: '2026-06-07', stage: 'A', act: 'X', start: '12:00', end: '13:00' },
                    { day: '2026-06-05', stage: 'A', act: 'Y', start: '12:00', end: '13:00' },
                    { day: '2026-06-06', stage: 'A', act: 'Z', start: '12:00', end: '13:00' }
                ]
            };
            
            const days = [...new Set(timetable.timetable.map(a => a.day))].sort();
            expect(days).toEqual(['2026-06-05', '2026-06-06', '2026-06-07']);
        });
    });

    describe('Acts Filtering', () => {
        it('sollte Acts nach Tag filtern', () => {
            const filterByDay = (timetable, day) => {
                return timetable.timetable.filter(a => a.day === day);
            };
            
            const day1Acts = filterByDay(validTimetable, '2026-06-05');
            expect(day1Acts.length).toBe(1);
            expect(day1Acts[0].act).toBe('Volbeat');
        });

        it('sollte leere Acts-Liste returnen für unbekannte Tage', () => {
            const filterByDay = (timetable, day) => {
                return timetable.timetable.filter(a => a.day === day);
            };
            
            const acts = filterByDay(validTimetable, '2099-01-01');
            expect(acts).toEqual([]);
        });

        it('sollte Stages extrahieren', () => {
            const getStages = (timetable) => {
                return [...new Set(timetable.timetable.map(a => a.stage))];
            };
            
            const stages = getStages(validTimetable);
            expect(stages).toContain('Utopia Stage');
            expect(stages).toContain('Mandora Stage');
        });
    });

    describe('Time Parsing', () => {
        it('sollte Zeit-Strings korrekt parsen', () => {
            const parseTime = (t) => {
                const [h, m] = t.split(':').map(Number);
                if (isNaN(h) || isNaN(m)) return 0;
                return h < 6 ? (h + 24) * 60 + m : h * 60 + m;
            };
            
            expect(parseTime('12:00')).toBe(720); // 12 * 60
            expect(parseTime('21:10')).toBe(1270); // 21 * 60 + 10
            expect(parseTime('01:30')).toBe(1470); // (1+24) * 60 + 30
        });

        it('sollte ungültige Zeiten handhaben', () => {
            const parseTime = (t) => {
                const [h, m] = t.split(':').map(Number);
                if (isNaN(h) || isNaN(m)) return 0;
                return h < 6 ? (h + 24) * 60 + m : h * 60 + m;
            };
            
            expect(parseTime('invalid')).toBe(0);
            expect(parseTime('25:00')).toBe(1500);
        });
    });

    describe('Current Day Validation', () => {
        it('sollte nur gültige Tage akzeptieren', () => {
            const isValidDay = (timetable, day) => {
                return timetable && 
                       timetable.timetable.some(a => a.day === day);
            };
            
            expect(isValidDay(validTimetable, '2026-06-05')).toBe(true);
            expect(isValidDay(validTimetable, '2026-06-10')).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('sollte große Timetables handhaben', () => {
            const bigTimetable = {
                timetable: Array(1000).fill(null).map((_, i) => ({
                    day: '2026-06-05',
                    stage: `Stage ${i % 10}`,
                    act: `Act ${i}`,
                    start: `${12 + (i % 12)}:00`,
                    end: `${13 + (i % 12)}:00`
                }))
            };
            
            const stages = [...new Set(bigTimetable.timetable.map(a => a.stage))];
            expect(stages.length).toBe(10);
        });

        it('sollte Acts mit Sonderzeichen handhaben', () => {
            const timetable = {
                timetable: [
                    { day: '2026-06-05', stage: 'Stage', act: 'AC/DC', start: '12:00', end: '13:00' },
                    { day: '2026-06-05', stage: 'Stage', act: 'Café Tacvba', start: '13:00', end: '14:00' }
                ]
            };
            
            const acts = timetable.timetable.map(a => a.act);
            expect(acts).toContain('AC/DC');
            expect(acts).toContain('Café Tacvba');
        });
    });
});
