import * as authService from "../lib/authService";

jest.mock("../lib/repositories/userRepository", () => ({
  findByEmailOrUsername: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
}));

const userRepository = require("../lib/repositories/userRepository");

const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  email: "u@t.com",
  username: "user",
  password_hash: "$2a$12$dummy",
  salt: "salty",
  created_at: new Date(),
};

describe("hashPassword", () => {
  it("returns hash and salt", async () => {
    const result = await authService.hashPassword("password123");
    expect(result).toHaveProperty("hash");
    expect(result).toHaveProperty("salt");
    expect(typeof result.hash).toBe("string");
    expect(typeof result.salt).toBe("string");
    expect(result.hash.length).toBeGreaterThan(0);
    expect(result.salt.length).toBeGreaterThan(0);
  });
});

describe("verifyPassword", () => {
  it("returns true when password matches hash", async () => {
    const { hash } = await authService.hashPassword("secret");
    const ok = await authService.verifyPassword("secret", hash);
    expect(ok).toBe(true);
  });

  it("returns false when password does not match", async () => {
    const { hash } = await authService.hashPassword("secret");
    const ok = await authService.verifyPassword("wrong", hash);
    expect(ok).toBe(false);
  });
});

describe("verifyJWT", () => {
  it("returns userId for valid token", async () => {
    const token = await authService.generateJWT("507f1f77bcf86cd799439011");
    const result = await authService.verifyJWT(token);
    expect(result).toEqual({ userId: "507f1f77bcf86cd799439011" });
  });

  it("returns null for invalid token", async () => {
    const result = await authService.verifyJWT("invalid.jwt.here");
    expect(result).toBeNull();
  });
});

describe("register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns error when email already exists", async () => {
    userRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
    const result = await authService.register({
      email: "u@t.com",
      password: "pass",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("registado");
  });

  it("returns error when username already taken", async () => {
    userRepository.findByEmailOrUsername.mockResolvedValue(null);
    userRepository.findByUsername.mockResolvedValue(mockUser);
    const result = await authService.register({
      email: "new@t.com",
      username: "user",
      password: "pass",
    });
    expect(result.success).toBe(false);
  });

  it("returns success and user when registration succeeds", async () => {
    userRepository.findByEmailOrUsername.mockResolvedValue(null);
    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({ ...mockUser, _id: "newid" });
    const result = await authService.register({
      email: "new@t.com",
      username: "newuser",
      password: "pass",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user).toHaveProperty("_id");
      expect(result.user).toHaveProperty("email", "new@t.com");
    }
  });
});

describe("login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns error when user not found", async () => {
    userRepository.findByEmailOrUsername.mockResolvedValue(null);
    const result = await authService.login("u@t.com", "pass");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("inválidas");
  });

  it("returns error when password wrong", async () => {
    const { hash } = await authService.hashPassword("correct");
    userRepository.findByEmailOrUsername.mockResolvedValue({
      ...mockUser,
      password_hash: hash,
    });
    const result = await authService.login("u@t.com", "wrong");
    expect(result.success).toBe(false);
  });

  it("returns success and user when credentials correct", async () => {
    const { hash } = await authService.hashPassword("correct");
    userRepository.findByEmailOrUsername.mockResolvedValue({
      ...mockUser,
      password_hash: hash,
    });
    const result = await authService.login("u@t.com", "correct");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user).toHaveProperty("_id");
      expect(result.user).toHaveProperty("email");
    }
  });
});
