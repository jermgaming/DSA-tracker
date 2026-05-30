jest.mock('@supabase/supabase-js');

describe('lib/supabase', () => {
  describe('isAdmin', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      process.env.REACT_APP_SUPABASE_URL = 'https://mock.supabase.co';
      process.env.REACT_APP_SUPABASE_ANON_KEY = 'mock-anon-key';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return true for an admin email', () => {
      process.env.REACT_APP_ADMIN_EMAILS = 'admin@test.com, user@test.com';
      jest.resetModules();
      const { isAdmin } = require('../lib/supabase');
      expect(isAdmin('admin@test.com')).toBe(true);
    });

    it('should return false for a non-admin email', () => {
      process.env.REACT_APP_ADMIN_EMAILS = 'admin@test.com';
      jest.resetModules();
      const { isAdmin } = require('../lib/supabase');
      expect(isAdmin('other@test.com')).toBe(false);
    });

    it('should handle empty admin list', () => {
      process.env.REACT_APP_ADMIN_EMAILS = '';
      jest.resetModules();
      const { isAdmin } = require('../lib/supabase');
      expect(isAdmin('anyone@test.com')).toBe(false);
    });

    it('should trim whitespace from admin emails', () => {
      process.env.REACT_APP_ADMIN_EMAILS = '  admin@test.com , another@test.com  ';
      jest.resetModules();
      const { isAdmin } = require('../lib/supabase');
      expect(isAdmin('admin@test.com')).toBe(true);
      expect(isAdmin('another@test.com')).toBe(true);
    });

    it('should handle null input', () => {
      process.env.REACT_APP_ADMIN_EMAILS = 'admin@test.com';
      jest.resetModules();
      const { isAdmin } = require('../lib/supabase');
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
    });
  });
});
