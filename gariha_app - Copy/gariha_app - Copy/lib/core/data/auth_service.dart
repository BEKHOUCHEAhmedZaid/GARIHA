import 'package:flutter/material.dart';
import 'api_service.dart';
import 'app_models.dart';
import 'user_session.dart';

class AuthService {
  AuthService._internal();
  static final AuthService instance = AuthService._internal();

  final ApiService _api = ApiService.instance;

  // ══════════════════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════════════════
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      debugPrint('[AuthService] login() → POST /auth/login');

      final loginResult = await _api.login(email: email, password: password);
      debugPrint('[AuthService] login result: $loginResult');

      if (!loginResult['success']) {
        return AuthResult.error(loginResult['message'] ?? 'Login failed');
      }

      debugPrint('[AuthService] token ok → GET /auth/me');
      final profileResult = await _api.getMe();
      debugPrint('[AuthService] profile result: $profileResult');

      if (!profileResult['success']) {
        return AuthResult.error('Login succeeded but failed to load profile');
      }

      _updateUserSession(profileResult['data']);
      debugPrint('[AuthService] login complete ✓');
      return AuthResult.success();
    } catch (e, stack) {
      // ← catch TOUT pour éviter que l'exception remonte dans le screen
      debugPrint('[AuthService] login ERROR: $e');
      debugPrint('[AuthService] stack: $stack');
      return AuthResult.error('Connection error: ${e.toString()}');
    }
  }

  // ══════════════════════════════════════════════════════
  // REGISTER
  // ══════════════════════════════════════════════════════
  Future<AuthResult> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String phone = '',
    String plateNumber = '',
    String parkingName = '',
    String location = '',
    String spots = '',
  }) async {
    try {
      debugPrint('[AuthService] register() → POST /auth/register');

      final registerResult = await _api.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phone: phone,
        plateNumber: plateNumber,
        parkingName: parkingName,
        location: location,
        spots: spots,
      );
      debugPrint('[AuthService] register result: $registerResult');

      if (!registerResult['success']) {
        return AuthResult.error(
          registerResult['message'] ?? 'Registration failed',
        );
      }

      debugPrint('[AuthService] register ok → POST /auth/login');
      final loginResult = await _api.login(email: email, password: password);
      debugPrint('[AuthService] auto-login result: $loginResult');

      if (!loginResult['success']) {
        return AuthResult.error('Account created but login failed');
      }

      debugPrint('[AuthService] auto-login ok → GET /auth/me');
      final profileResult = await _api.getMe();
      debugPrint('[AuthService] profile result: $profileResult');

      if (!profileResult['success']) {
        return AuthResult.error('Registered but failed to load profile');
      }

      _updateUserSession(profileResult['data']);
      debugPrint('[AuthService] register complete ✓');
      return AuthResult.success();
    } catch (e, stack) {
      debugPrint('[AuthService] register ERROR: $e');
      debugPrint('[AuthService] stack: $stack');
      return AuthResult.error('Connection error: ${e.toString()}');
    }
  }

  // ══════════════════════════════════════════════════════
  // AUTO LOGIN
  // ══════════════════════════════════════════════════════
  Future<bool> tryAutoLogin() async {
    try {
      final token = await _api.loadToken();
      if (token == null || token.isEmpty) return false;

      final profileResult = await _api.getMe();
      if (!profileResult['success']) {
        await _api.clearToken();
        return false;
      }

      _updateUserSession(profileResult['data']);
      return true;
    } catch (e) {
      debugPrint('[AuthService] tryAutoLogin ERROR: $e');
      return false;
    }
  }

  // ══════════════════════════════════════════════════════
  // LOGOUT
  // ══════════════════════════════════════════════════════
  Future<void> logout() async {
    await _api.logout();
    UserSession.instance.clear();
  }

  // ══════════════════════════════════════════════════════
  // _updateUserSession
  // ══════════════════════════════════════════════════════
  void _updateUserSession(Map<String, dynamic> data) {
    final fullName = (data['full_name'] ?? '').toString().trim();
    final parts = fullName.split(' ');
    final firstName = parts.isNotEmpty ? parts.first : '';
    final lastName = parts.length > 1
        ? parts.sublist(1).join(' ').toUpperCase()
        : '';

    DateTime memberSince;
    try {
      memberSince = DateTime.parse(data['created_at'] ?? '');
    } catch (_) {
      memberSince = DateTime.now();
    }

    UserSession.instance.currentUser = UserModel(
      id: data['id']?.toString() ?? '',
      firstName: firstName,
      lastName: lastName,
      email: data['email'] ?? '',
      phone: data['phone'] ?? '',
      avatarUrl: data['avatar'] ?? '',
      subscription: data['role'] ?? 'Regular',
      memberSince: memberSince,
    );
  }
}

class AuthResult {
  final bool isSuccess;
  final String? errorMessage;

  const AuthResult._({required this.isSuccess, this.errorMessage});

  factory AuthResult.success() => const AuthResult._(isSuccess: true);
  factory AuthResult.error(String message) =>
      AuthResult._(isSuccess: false, errorMessage: message);
}
