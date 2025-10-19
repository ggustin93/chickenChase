/**
 * DatabaseService Unit Tests
 * 
 * Tests the base DatabaseService class functionality
 * Following SOLID principles: Testing base abstractions
 * KISS: Simple, focused unit tests
 * DRY: Reusable test patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseService } from '../../src/services/base/DatabaseService';
import type { ApiResponse } from '../../src/data/database-types';

// Test implementation of DatabaseService following SOLID principles
class TestDatabaseService extends DatabaseService<'games', any, any, any> {
  protected tableName = 'games' as const;
  
  // Expose protected methods for testing
  public testSuccess<T>(data: T): ApiResponse<T> {
    return this.success(data);
  }
  
  public testFailure(error: string): ApiResponse<any> {
    return this.failure(error);
  }
  
  public testFormatError(error: Error, operation: string): string {
    return this.formatError(error, operation);
  }
}

describe('DatabaseService Base Class', () => {
  let service: TestDatabaseService;

  beforeEach(() => {
    service = new TestDatabaseService();
  });

  describe('Response Formatting (SOLID: Consistent Interface)', () => {
    it('should format success responses correctly', () => {
      const testData = { id: '1', name: 'Test' };
      const response = service.testSuccess(testData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
      expect(response.error).toBeNull();
    });

    it('should format failure responses correctly', () => {
      const errorMessage = 'Test error';
      const response = service.testFailure(errorMessage);

      expect(response.success).toBe(false);
      expect(response.error).toBe(errorMessage);
      expect(response.data).toBeNull();
    });

    it('should handle null/undefined data in success responses', () => {
      const response = service.testSuccess(null);

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });
  });

  describe('Error Formatting (SOLID: Error Handling)', () => {
    it('should format generic errors with operation context', () => {
      const error = new Error('Database connection failed');
      const operation = 'findById';
      
      const formattedError = service.testFormatError(error, operation);

      expect(formattedError).toContain('Error during findById');
      expect(formattedError).toContain('Database connection failed');
    });

    it('should handle errors without messages', () => {
      const error = new Error();
      const operation = 'create';
      
      const formattedError = service.testFormatError(error, operation);

      expect(formattedError).toContain('Error during create');
      expect(formattedError).toContain('');
    });

    it('should handle non-Error objects', () => {
      const error = { message: 'Custom error object' } as Error;
      const operation = 'update';
      
      const formattedError = service.testFormatError(error, operation);

      expect(formattedError).toContain('Error during update');
      expect(formattedError).toContain('Custom error object');
    });
  });

  describe('Type Safety (SOLID: Interface Segregation)', () => {
    it('should maintain type safety in generic responses', () => {
      interface TestData {
        id: string;
        value: number;
      }

      const testData: TestData = { id: 'test', value: 42 };
      const response = service.testSuccess(testData);

      // TypeScript should enforce this at compile time
      expect(response.data?.id).toBe('test');
      expect(response.data?.value).toBe(42);
    });

    it('should handle array responses correctly', () => {
      const testArray = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];

      const response = service.testSuccess(testArray);

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
    });
  });

  describe('Edge Cases (SOLID: Robustness)', () => {
    it('should handle empty string errors', () => {
      const response = service.testFailure('');

      expect(response.success).toBe(false);
      expect(response.error).toBe('');
    });

    it('should handle complex error objects', () => {
      const complexError = new Error('Complex error');
      (complexError as any).code = 'ERR_001';
      (complexError as any).details = { field: 'invalid' };

      const formattedError = service.testFormatError(complexError, 'complexOperation');

      expect(formattedError).toContain('Database error during complexOperation');
      expect(formattedError).toContain('Complex error');
    });

    it('should handle undefined/null in error formatting', () => {
      const nullError = null as any;
      const formattedError = service.testFormatError(nullError, 'testOp');

      expect(formattedError).toContain('Unknown error during testOp');
    });
  });

  describe('Interface Consistency (SOLID: Liskov Substitution)', () => {
    it('should provide consistent interface for all response types', () => {
      const successResponse = service.testSuccess({ data: 'test' });
      const failureResponse = service.testFailure('error');

      // Both responses should have the same structure
      expect(typeof successResponse.success).toBe('boolean');
      expect(typeof failureResponse.success).toBe('boolean');

      // Success response should have data, failure should have error
      expect(successResponse.success ? 'data' in successResponse : 'error' in failureResponse).toBe(true);
    });
  });

  describe('Performance Considerations (MVP: Efficiency)', () => {
    it('should handle large data sets efficiently', () => {
      // Generate large test data
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        value: i,
        data: `test-data-${i}`.repeat(10)
      }));

      const startTime = performance.now();
      const response = service.testSuccess(largeDataSet);
      const endTime = performance.now();

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle error formatting efficiently', () => {
      const error = new Error('Test error with long message '.repeat(100));
      
      const startTime = performance.now();
      const formattedError = service.testFormatError(error, 'testOperation');
      const endTime = performance.now();

      expect(formattedError).toContain('Error during testOperation');
      expect(endTime - startTime).toBeLessThan(50); // Should be fast
    });
  });
});