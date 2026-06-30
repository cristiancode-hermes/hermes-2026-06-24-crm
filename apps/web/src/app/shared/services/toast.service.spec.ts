import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a success toast', () => {
    service.success('Operation completed');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Operation completed');
    expect(toasts[0].id).toBeGreaterThan(0);
  });

  it('should add an error toast', () => {
    service.error('Something went wrong');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].message).toBe('Something went wrong');
  });

  it('should add an info toast', () => {
    service.info('Just so you know');

    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('info');
  });

  it('should dismiss a toast by id', () => {
    service.show('info', 'First');
    service.show('info', 'Second');

    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);

    const remaining = service.toasts();
    expect(remaining.length).toBe(1);
    expect(remaining[0].message).toBe('Second');
  });

  it('should auto-dismiss toasts after timeout', () => {
    vi.useFakeTimers();
    service.show('info', 'Auto-dismiss');

    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(5000);

    expect(service.toasts().length).toBe(0);
    vi.useRealTimers();
  });

  it('should handle multiple toasts', () => {
    service.success('First');
    service.error('Second');
    service.info('Third');

    expect(service.toasts().length).toBe(3);
    expect(service.toasts().map((t) => t.type)).toEqual(['success', 'error', 'info']);
  });
});
