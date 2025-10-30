import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateLocationScore,
  calculateTimeScore,
} from './scoreCalculation';

/**
 * Tests for score calculation utilities
 * These functions are critical for game mechanics and must be accurate
 */

describe('calculateDistance', () => {
  it('should return 0 for identical coordinates', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });

  it('should calculate distance between New York and Los Angeles correctly', () => {
    // New York: 40.7128° N, 74.0060° W
    // Los Angeles: 34.0522° N, 118.2437° W
    // Expected distance: ~3944 km
    const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  it('should calculate distance between London and Paris correctly', () => {
    // London: 51.5074° N, 0.1278° W
    // Paris: 48.8566° N, 2.3522° E
    // Expected distance: ~344 km
    const distance = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(330);
    expect(distance).toBeLessThan(360);
  });

  it('should calculate distance across the equator', () => {
    // Point in Northern hemisphere
    const lat1 = 10.0;
    const lon1 = 0.0;
    // Point in Southern hemisphere
    const lat2 = -10.0;
    const lon2 = 0.0;
    // Expected: ~2223 km (roughly 20 degrees of latitude)
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(2200);
    expect(distance).toBeLessThan(2250);
  });

  it('should handle negative longitude correctly', () => {
    // Test with western hemisphere coordinates
    const distance = calculateDistance(0, -10, 0, -20);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1200);
  });

  it('should be symmetric (distance A to B = distance B to A)', () => {
    const distanceAB = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
    const distanceBA = calculateDistance(34.0522, -118.2437, 40.7128, -74.0060);
    expect(distanceAB).toBe(distanceBA);
  });
});

describe('calculateLocationScore', () => {
  it('should return maximum score (10000) for 0 km error', () => {
    const score = calculateLocationScore(0);
    expect(score).toBe(10000);
  });

  it('should deduct 5 points per km', () => {
    // 100 km error = 500 points deducted
    const score = calculateLocationScore(100);
    expect(score).toBe(9500);
  });

  it('should return 5000 points for 1000 km error', () => {
    // 1000 km * 5 = 5000 points deducted
    const score = calculateLocationScore(1000);
    expect(score).toBe(5000);
  });

  it('should return 0 for 2000 km error (maximum penalty)', () => {
    // 2000 km * 5 = 10000 points deducted (entire score)
    const score = calculateLocationScore(2000);
    expect(score).toBe(0);
  });

  it('should return 0 for errors greater than 2000 km', () => {
    const score = calculateLocationScore(5000);
    expect(score).toBe(0);
  });

  it('should round the score to nearest integer', () => {
    // 100.5 km error = 502.5 points deducted = 9497.5 -> 9498
    const score = calculateLocationScore(100.5);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('should handle very small distances correctly', () => {
    // 0.1 km error = 0.5 points deducted = 9999.5 -> 10000
    const score = calculateLocationScore(0.1);
    expect(score).toBe(10000);
  });
});

describe('calculateTimeScore', () => {
  it('should return maximum score (10000) for 0 year error', () => {
    const score = calculateTimeScore(0);
    expect(score).toBe(10000);
  });

  it('should deduct 400 points per year', () => {
    // 5 year error = 2000 points deducted
    const score = calculateTimeScore(5);
    expect(score).toBe(8000);
  });

  it('should return 5000 points for 12.5 year error', () => {
    // 12.5 years * 400 = 5000 points deducted
    const score = calculateTimeScore(12.5);
    expect(score).toBe(5000);
  });

  it('should return 0 for 25 year error (maximum penalty)', () => {
    // 25 years * 400 = 10000 points deducted (entire score)
    const score = calculateTimeScore(25);
    expect(score).toBe(0);
  });

  it('should return 0 for errors greater than 25 years', () => {
    const score = calculateTimeScore(100);
    expect(score).toBe(0);
  });

  it('should handle negative year differences (absolute value)', () => {
    const score = calculateTimeScore(-10);
    expect(score).toBe(6000); // Same as +10
  });

  it('should round the score to nearest integer', () => {
    // 5.5 year error = 2200 points deducted = 7800
    const score = calculateTimeScore(5.5);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('should handle very small year differences correctly', () => {
    // 1 year error = 400 points deducted
    const score = calculateTimeScore(1);
    expect(score).toBe(9600);
  });
});

describe('Score Calculation - Combined Scenarios', () => {
  it('should achieve perfect score (20000) with exact guess', () => {
    const locationScore = calculateLocationScore(0);
    const timeScore = calculateTimeScore(0);
    const totalScore = locationScore + timeScore;
    expect(totalScore).toBe(20000);
  });

  it('should achieve reasonable score with small errors', () => {
    // 50 km error (9750 points) + 2 year error (9200 points) = 18950 points
    const locationScore = calculateLocationScore(50);
    const timeScore = calculateTimeScore(2);
    const totalScore = locationScore + timeScore;
    expect(totalScore).toBe(18950);
  });

  it('should achieve medium score with moderate errors', () => {
    // 500 km error (7500 points) + 10 year error (6000 points) = 13500 points
    const locationScore = calculateLocationScore(500);
    const timeScore = calculateTimeScore(10);
    const totalScore = locationScore + timeScore;
    expect(totalScore).toBe(13500);
  });

  it('should achieve low score with large errors', () => {
    // 1500 km error (2500 points) + 20 year error (2000 points) = 4500 points
    const locationScore = calculateLocationScore(1500);
    const timeScore = calculateTimeScore(20);
    const totalScore = locationScore + timeScore;
    expect(totalScore).toBe(4500);
  });

  it('should achieve minimum score (0) with maximum errors', () => {
    // 3000 km error (0 points) + 50 year error (0 points) = 0 points
    const locationScore = calculateLocationScore(3000);
    const timeScore = calculateTimeScore(50);
    const totalScore = locationScore + timeScore;
    expect(totalScore).toBe(0);
  });
});

describe('Edge Cases and Boundary Conditions', () => {
  it('should handle extremely large distances gracefully', () => {
    // Maximum possible distance on Earth is roughly 20,000 km (half circumference)
    const score = calculateLocationScore(20000);
    expect(score).toBe(0);
  });

  it('should handle fractional year errors', () => {
    const score = calculateTimeScore(2.5);
    expect(score).toBe(9000);
  });

  it('should maintain score boundaries at exactly 2000 km', () => {
    const scoreBefore = calculateLocationScore(1999);
    const scoreAt = calculateLocationScore(2000);
    const scoreAfter = calculateLocationScore(2001);

    expect(scoreBefore).toBeGreaterThan(0);
    expect(scoreAt).toBe(0);
    expect(scoreAfter).toBe(0);
  });

  it('should maintain score boundaries at exactly 25 years', () => {
    const scoreBefore = calculateTimeScore(24);
    const scoreAt = calculateTimeScore(25);
    const scoreAfter = calculateTimeScore(26);

    expect(scoreBefore).toBeGreaterThan(0);
    expect(scoreAt).toBe(0);
    expect(scoreAfter).toBe(0);
  });
});
