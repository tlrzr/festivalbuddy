/**
 * Jest Setup - Globale Konfiguration für Tests
 */

// Mock localStorage für alle Tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Stille Console-Fehler für Tests (optional)
// jest.spyOn(console, 'error').mockImplementation(() => {});
