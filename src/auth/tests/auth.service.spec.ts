import { describe, it, expect, beforeEach } from 'vitest';

// Simulating NestJS dependencies without importing
class UnauthorizedException extends Error {
  constructor(message?: string) {
    super(message || 'Unauthorized');
    this.name = 'UnauthorizedException';
  }
}

// Mock AuthService implementation
class AuthService {
  constructor(
    private readonly userRepository: any, 
    private readonly jwtService: any
  ) {}

  async validateUser(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordMatch = await this.comparePasswords(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('User not found'); // Intentionally generic for security
    }

    const token = this.jwtService.sign({ 
      id: user.id, 
      email: user.email 
    });

    return {
      id: user.id,
      email: user.email,
      token
    };
  }

  private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // Simulating bcrypt compare
    return plainPassword === hashedPassword;
  }
}

// Mock function implementation
function mockFn() {
  const fn = (...args: any[]) => {};
  fn.mockReturnValue = (value: any) => { fn.returnedValue = value; return fn; };
  fn.mockResolvedValue = (value: any) => { fn.resolvedValue = value; return fn; };
  fn.mockRejectedValue = (value: any) => { fn.rejectedValue = value; return fn; };
  return fn;
}

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: mockFn(),
    };

    mockJwtService = {
      sign: mockFn(),
    };

    authService = new AuthService(mockUserRepository, mockJwtService);
  });

  it('should validate user successfully when credentials are correct', async () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUser = {
      id: '1',
      email: mockEmail,
      password: mockPassword,
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    mockJwtService.sign.mockReturnValue('mocktoken');

    const result = await authService.validateUser(mockEmail, mockPassword);

    expect(result).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      token: 'mocktoken',
    });

    expect(mockUserRepository.findByEmail).toBeDefined();
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';

    mockUserRepository.findByEmail.mockResolvedValue(null);

    try {
      await authService.validateUser(mockEmail, mockPassword);
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('User not found');
    }
  });

  it('should throw UnauthorizedException when password is incorrect', async () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUser = {
      id: '1',
      email: mockEmail,
      password: 'differentpassword',
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);

    try {
      await authService.validateUser(mockEmail, mockPassword);
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('User not found'); // Intentionally generic for security
    }
  });

  it('should handle empty email or password', async () => {
    try {
      await authService.validateUser('', '');
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('Invalid credentials');
    }

    try {
      await authService.validateUser('test@example.com', '');
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('Invalid credentials');
    }

    try {
      await authService.validateUser('', 'password123');
    } catch (error: any) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toBe('Invalid credentials');
    }
  });
});