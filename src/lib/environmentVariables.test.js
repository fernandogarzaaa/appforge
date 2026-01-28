import { describe, it, expect } from 'vitest';
import {
  validateVariableName,
  validateVariableValue,
  maskValue,
  toExportString,
  generateEnvFileContent,
  parseEnvFileContent,
  ENV_VAR_TYPES
} from '@/lib/environmentVariables';

describe('Environment Variables Utilities', () => {
  describe('validateVariableName', () => {
    it('should accept valid variable names', () => {
      const result = validateVariableName('API_KEY');
      expect(result.isValid).toBe(true);
    });

    it('should accept names with numbers', () => {
      const result = validateVariableName('DATABASE_URL_1');
      expect(result.isValid).toBe(true);
    });

    it('should reject lowercase names', () => {
      const result = validateVariableName('api_key');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject reserved names', () => {
      const result = validateVariableName('NODE_ENV');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('reserved');
    });

    it('should reject empty names', () => {
      const result = validateVariableName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject names exceeding max length', () => {
      const longName = 'A'.repeat(51);
      const result = validateVariableName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed 50 characters');
    });
  });

  describe('validateVariableValue', () => {
    it('should accept valid string values', () => {
      const result = validateVariableValue('some_value', ENV_VAR_TYPES.STRING);
      expect(result.isValid).toBe(true);
    });

    it('should validate numbers', () => {
      const result = validateVariableValue('123', ENV_VAR_TYPES.NUMBER);
      expect(result.isValid).toBe(true);
    });

    it('should reject non-numeric for NUMBER type', () => {
      const result = validateVariableValue('abc', ENV_VAR_TYPES.NUMBER);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('should validate booleans', () => {
      const validBools = ['true', 'false', '0', '1', 'yes', 'no', 'on', 'off'];
      validBools.forEach(val => {
        const result = validateVariableValue(val, ENV_VAR_TYPES.BOOLEAN);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid booleans', () => {
      const result = validateVariableValue('maybe', ENV_VAR_TYPES.BOOLEAN);
      expect(result.isValid).toBe(false);
    });

    it('should enforce minimum length for secrets', () => {
      const result = validateVariableValue('short', ENV_VAR_TYPES.SECRET);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('least 8 characters');
    });
  });

  describe('maskValue', () => {
    it('should mask string values', () => {
      const masked = maskValue('my_secret_value', ENV_VAR_TYPES.STRING);
      expect(masked).toContain('•');
      expect(masked).toMatch(/^.{2}•+.{2}$/);
    });

    it('should mask secret values', () => {
      const masked = maskValue('super_secret_key_123', ENV_VAR_TYPES.SECRET);
      expect(masked).toContain('•');
    });

    it('should handle short values', () => {
      const masked = maskValue('secret', ENV_VAR_TYPES.SECRET);
      expect(masked).toBe('••••••••');
    });

    it('should not mask numbers', () => {
      const masked = maskValue('12345', ENV_VAR_TYPES.NUMBER);
      expect(masked).toBe('12345');
    });
  });

  describe('toExportString', () => {
    it('should generate export string', () => {
      const variable = { name: 'API_KEY', value: 'abc123' };
      const result = toExportString(variable);
      expect(result).toBe('export API_KEY=abc123');
    });

    it('should quote values with spaces', () => {
      const variable = { name: 'LONG_VALUE', value: 'has spaces' };
      const result = toExportString(variable);
      expect(result).toContain('"');
      expect(result).toContain('has spaces');
    });
  });

  describe('generateEnvFileContent and parseEnvFileContent', () => {
    it('should generate and parse env file content', () => {
      const variables = [
        { name: 'API_KEY', value: 'key123' },
        { name: 'SECRET', value: 'secret456' },
        { name: 'PORT', value: '3000' }
      ];

      const content = generateEnvFileContent(variables);
      expect(content).toContain('API_KEY=key123');
      expect(content).toContain('SECRET=secret456');
      expect(content).toContain('PORT=3000');
    });

    it('should parse env file content', () => {
      const content = `API_KEY=key123\nSECRET=secret456\nPORT=3000`;
      const parsed = parseEnvFileContent(content);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0].name).toBe('API_KEY');
      expect(parsed[0].value).toBe('key123');
    });

    it('should ignore comments in env file', () => {
      const content = `# This is a comment\nAPI_KEY=value\n# Another comment\nSECRET=secret`;
      const parsed = parseEnvFileContent(content);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('API_KEY');
      expect(parsed[1].name).toBe('SECRET');
    });
  });
});
