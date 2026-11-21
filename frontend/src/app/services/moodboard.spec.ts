import { TestBed } from '@angular/core/testing';
import { Moodboard } from './moodboard';

describe('Moodboard', () => {
  let service: Moodboard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Moodboard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
