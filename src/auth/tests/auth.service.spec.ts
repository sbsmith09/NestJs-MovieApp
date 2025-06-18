import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock dependencies
const mockUserRepository = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(
      mockUserRepository as any, 
      mockJwtService as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUser = {
      id: '1',
      email: mockEmail,
      password: 'hashedpassword',
    };

    it('should validate user successfully when credentials are correct', async () => {
      // Mock bcrypt compare to return true
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      
      // Mock user repository to return user
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      // Mock JWT service to return token
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
      // Mock user repository to return null
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.validateUser(mockEmail, mockPassword))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Mock user repository to return user
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      
      // Mock bcrypt compare to return false
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(authService.validateUser(mockEmail, mockPassword))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty email or password', async () => {
      await expect(authService.validateUser('', ''))
        .rejects.toThrow(UnauthorizedException);

      await expect(authService.validateUser(mockEmail, ''))
        .rejects.toThrow(UnauthorizedException);

      await expect(authService.validateUser('', mockPassword))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});