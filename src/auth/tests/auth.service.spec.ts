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
      throw new UnauthorizedException('Invalid password');
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

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
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

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockEmail);
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';

    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.validateUser(mockEmail, mockPassword))
      .rejects.toThrow(UnauthorizedException);
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

    await expect(authService.validateUser(mockEmail, mockPassword))
      .rejects.toThrow(UnauthorizedException);
  });

  it('should handle empty email or password', async () => {
    await expect(authService.validateUser('', ''))
      .rejects.toThrow(UnauthorizedException);

    await expect(authService.validateUser('test@example.com', ''))
      .rejects.toThrow(UnauthorizedException);

    await expect(authService.validateUser('', 'password123'))
      .rejects.toThrow(UnauthorizedException);
  });
});