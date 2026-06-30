import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    name: 'Admin',
    email: 'admin@test.com',
    role: 'admin',
    organizationId: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: {} as any }]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null user and no token', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('login', () => {
    it('should send login request and store token', async () => {
      const mockResponse = {
        accessToken: 'test-token-123',
        user: mockUser,
      };

      const loginPromise = firstValueFrom(service.login('admin@test.com', 'password'));

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'password' });
      req.flush(mockResponse);

      const result = await loginPromise;
      expect(result.accessToken).toBe('test-token-123');
      expect(service.currentUser()?.name).toBe('Admin');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should fail with invalid credentials', async () => {
      const loginPromise = firstValueFrom(service.login('wrong@test.com', 'wrong'));

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      await expect(loginPromise).rejects.toBeTruthy();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new organization and user', async () => {
      const mockResponse = {
        accessToken: 'new-token',
        user: { ...mockUser, id: 2, organizationId: 2 },
      };

      const registerPromise = firstValueFrom(
        service.register('My Org', 'Jane', 'jane@test.com', 'password')
      );

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        orgName: 'My Org',
        userName: 'Jane',
        email: 'jane@test.com',
        password: 'password',
      });
      req.flush(mockResponse);

      const result = await registerPromise;
      expect(result.accessToken).toBe('new-token');
      expect(service.currentUser()?.organizationId).toBe(2);
    });
  });

  describe('logout', () => {
    it('should clear token and user', () => {
      localStorage.setItem('auth_token', 'some-token');
      service.currentUser.set(mockUser);

      service.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'some-token');
      expect(service.isAuthenticated()).toBe(true);
    });
  });
});
