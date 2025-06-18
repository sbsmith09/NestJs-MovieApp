// User Validation Tests for AuthService

// Mock implementation of UnauthorizedException
class UnauthorizedException extends Error {
  constructor(message?: string) {
    super(message || 'Unauthorized');
    this.name = 'UnauthorizedException';
  }
}

// Mock AuthService with minimal implementation
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
    
    // Simulate security best practices
    if (!user || password !== user.password) {
      throw new UnauthorizedException('User not found');
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
}

// Basic async test helper
async function runTest(testFn: () => Promise<void>) {
  try {
    await testFn();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Test suite
const testAuthService = async () => {
  console.log('Starting AuthService tests...');

  // Setup mocks
  const mockUserRepository = {
    findByEmail: async (email: string) => 
      email === 'test@example.com' 
        ? { id: '1', email: 'test@example.com', password: 'password123' } 
        : null
  };

  const mockJwtService = {
    sign: () => 'mocktoken'
  };

  const authService = new AuthService(mockUserRepository, mockJwtService);

  // Test successful validation
  const successTest = await runTest(async () => {
    const result = await authService.validateUser('test@example.com', 'password123');
    if (!result || result.id !== '1' || result.token !== 'mocktoken') {
      throw new Error('Validation failed');
    }
  });

  // Test user not found
  const userNotFoundTest = await runTest(async () => {
    try {
      await authService.validateUser('nonexistent@example.com', 'password123');
      throw new Error('Should have thrown UnauthorizedException');
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw new Error('Wrong exception type');
      }
    }
  });

  // Test incorrect password
  const incorrectPasswordTest = await runTest(async () => {
    try {
      await authService.validateUser('test@example.com', 'wrongpassword');
      throw new Error('Should have thrown UnauthorizedException');
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw new Error('Wrong exception type');
      }
    }
  });

  // Test empty credentials
  const emptyCredentialsTest = await runTest(async () => {
    try {
      await authService.validateUser('', '');
      throw new Error('Should have thrown UnauthorizedException');
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        throw new Error('Wrong exception type');
      }
    }
  });

  // Report results
  const results = [
    successTest, 
    userNotFoundTest, 
    incorrectPasswordTest, 
    emptyCredentialsTest
  ];

  console.log('Test Results:');
  results.forEach((result, index) => {
    console.log(`Test ${index + 1}: ${result ? 'PASS' : 'FAIL'}`);
  });

  const allPassed = results.every(result => result);
  console.log(`Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

  return allPassed;
};

// Run the tests
testAuthService().then(result => {
  process.exit(result ? 0 : 1);
});