import 'dart:convert';
import 'dart:io';
import 'dart:async'; 
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ApiService {
  ApiService._internal();
  static final ApiService instance = ApiService._internal();

  static const String _baseUrl = AppConfig.baseUrl;
  static const String _tokenKey = 'gariha_access_token';

  // Timeout global — évite le spinner infini si le backend ne répond pas
  static const Duration _timeout = Duration(seconds: 15);

  String? _token;

  // ══════════════════════════════════════════════════════
  // Token
  // ══════════════════════════════════════════════════════
  Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<String?> loadToken() async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    return _token;
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  bool get hasToken => _token != null && _token!.isNotEmpty;

  // ══════════════════════════════════════════════════════
  // Headers
  // ══════════════════════════════════════════════════════
  Map<String, String> get _publicHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  Map<String, String> get _authHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $_token',
  };

  // ══════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════

  /// Decode JSON de façon sécurisée — évite FormatException
  Map<String, dynamic> _safeJsonDecode(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded;
      return {'raw': decoded};
    } catch (e) {
      debugPrint('[ApiService] JSON decode error: $e | body: $body');
      return {'detail': 'Invalid server response'};
    }
  }

  // ══════════════════════════════════════════════════════
  // POST /auth/login
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_baseUrl/auth/login'),
            headers: _publicHeaders,
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(_timeout); // ← timeout ajouté

      final data = _safeJsonDecode(response.body);
      debugPrint('[ApiService] POST /auth/login → ${response.statusCode}');

      if (response.statusCode == 200) {
        await saveToken(data['access_token'] ?? '');
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['detail'] ?? 'Login failed'};
      }
    } on SocketException {
      return {'success': false, 'message': 'No internet connection'};
    } on TimeoutException {
      return {'success': false, 'message': 'Server timeout — please retry'};
    } catch (e) {
      debugPrint('[ApiService] login exception: $e');
      return {'success': false, 'message': 'Unexpected error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // POST /auth/register
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> register({
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
      final body = <String, dynamic>{
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'password': password,
      };

      if (phone.isNotEmpty) body['phone'] = phone;
      if (plateNumber.isNotEmpty) body['plate_number'] = plateNumber;
      if (parkingName.isNotEmpty) body['parking_name'] = parkingName;
      if (location.isNotEmpty) body['location'] = location;
      if (spots.isNotEmpty) body['spots'] = int.tryParse(spots) ?? 0;

      final response = await http
          .post(
            Uri.parse('$_baseUrl/auth/register'),
            headers: _publicHeaders,
            body: jsonEncode(body),
          )
          .timeout(_timeout); // ← timeout ajouté

      final data = _safeJsonDecode(response.body);
      debugPrint('[ApiService] POST /auth/register → ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['detail'] ?? 'Registration failed',
        };
      }
    } on SocketException {
      return {'success': false, 'message': 'No internet connection'};
    } on TimeoutException {
      return {'success': false, 'message': 'Server timeout — please retry'};
    } catch (e) {
      debugPrint('[ApiService] register exception: $e');
      return {'success': false, 'message': 'Unexpected error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // GET /auth/me
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getMe() async {
    try {
      await loadToken();

      final response = await http
          .get(Uri.parse('$_baseUrl/auth/me'), headers: _authHeaders)
          .timeout(_timeout); // ← timeout ajouté

      final data = _safeJsonDecode(response.body);
      debugPrint('[ApiService] GET /auth/me → ${response.statusCode}');

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else if (response.statusCode == 401) {
        await clearToken();
        return {
          'success': false,
          'message': 'Session expired. Please login again.',
        };
      } else {
        return {
          'success': false,
          'message': data['detail'] ?? 'Failed to fetch profile',
        };
      }
    } on SocketException {
      return {'success': false, 'message': 'No internet connection'};
    } on TimeoutException {
      return {'success': false, 'message': 'Server timeout — please retry'};
    } catch (e) {
      debugPrint('[ApiService] getMe exception: $e');
      return {'success': false, 'message': 'Unexpected error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // GET /notifications/my-notifications
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getNotifications() async {
    try {
      await loadToken();
      final response = await http
          .get(
            Uri.parse('$_baseUrl/notifications/my'),
            headers: _authHeaders,
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to load notifications'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // GET /parking/mine
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getMyParkings() async {
    try {
      await loadToken();
      final response = await http
          .get(Uri.parse('$_baseUrl/parking/mine'), headers: _authHeaders)
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to load parkings'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // Logout
  // ══════════════════════════════════════════════════════
  Future<void> logout() async {
    await clearToken();
  }

  // ══════════════════════════════════════════════════════
  // GET /reservations/public/parkings
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getPublicParkings() async {
    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/reservations/public/parkings'), headers: _publicHeaders)
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to load parkings'};
      }
    } on SocketException {
      return {'success': false, 'message': 'No internet connection'};
    } on TimeoutException {
      return {'success': false, 'message': 'Server timeout — please retry'};
    } catch (e) {
      debugPrint('[ApiService] getPublicParkings exception: $e');
      return {'success': false, 'message': 'Unexpected error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // GET /reservations/public/parkings/{id}/all-spots
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getParkingSpots(int parkingId) async {
    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/reservations/public/parkings/$parkingId/all-spots'),
            headers: _publicHeaders,
          )
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to load spots'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // POST /reservations/driver/create (authenticated)
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> createReservation({
    required int parkingSpotId,
    required String driverName,
    required String plateNumber,
    int durationMinutes = 60,
  }) async {
    try {
      await loadToken();
      final body = {
        'parking_spot_id': parkingSpotId,
        'driver_name': driverName,
        'plate_number': plateNumber,
        'duration_minutes': durationMinutes,
      };

      final response = await http
          .post(
            Uri.parse('$_baseUrl/reservations/driver/create'),
            headers: _authHeaders,
            body: jsonEncode(body),
          )
          .timeout(_timeout);

      final data = _safeJsonDecode(response.body);
      debugPrint('[ApiService] POST /reservations/driver/create → ${response.statusCode}');

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['detail'] ?? 'Reservation failed'};
      }
    } on SocketException {
      return {'success': false, 'message': 'No internet connection'};
    } on TimeoutException {
      return {'success': false, 'message': 'Server timeout — please retry'};
    } catch (e) {
      debugPrint('[ApiService] createReservation exception: $e');
      return {'success': false, 'message': 'Unexpected error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // POST /reservations/{id}/cancel
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> cancelReservation(int reservationId) async {
    try {
      await loadToken();
      final response = await http
          .post(
            Uri.parse('$_baseUrl/reservations/$reservationId/cancel'),
            headers: _authHeaders,
          )
          .timeout(_timeout);

      final data = _safeJsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['detail'] ?? 'Cancel failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // POST /reservations/{id}/checkin
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> checkinReservation(int reservationId) async {
    try {
      await loadToken();
      final response = await http
          .post(
            Uri.parse('$_baseUrl/reservations/$reservationId/checkin'),
            headers: _authHeaders,
          )
          .timeout(_timeout);

      final data = _safeJsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['detail'] ?? 'Check-in failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // POST /reservations/{id}/checkout
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> checkoutReservation(int reservationId) async {
    try {
      await loadToken();
      final response = await http
          .post(
            Uri.parse('$_baseUrl/reservations/$reservationId/checkout'),
            headers: _authHeaders,
          )
          .timeout(_timeout);

      final data = _safeJsonDecode(response.body);
      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'message': data['detail'] ?? 'Check-out failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // GET /driver/reservations/active
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getActiveReservation() async {
    try {
      await loadToken();
      final response = await http
          .get(Uri.parse('$_baseUrl/driver/reservations/active'), headers: _authHeaders)
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to load active reservation'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // GET /driver/reservations/history
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getReservationHistory() async {
    try {
      await loadToken();
      final response = await http
          .get(Uri.parse('$_baseUrl/driver/reservations/history'), headers: _authHeaders)
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to load history'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }

  // ══════════════════════════════════════════════════════
  // GET /driver/profile
  // ══════════════════════════════════════════════════════
  Future<Map<String, dynamic>> getDriverProfile() async {
    try {
      await loadToken();
      final response = await http
          .get(Uri.parse('$_baseUrl/driver/profile'), headers: _authHeaders)
          .timeout(_timeout);

      if (response.statusCode == 200) {
        return {'success': true, 'data': jsonDecode(response.body)};
      } else {
        return {'success': false, 'message': 'Failed to load profile'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Error: $e'};
    }
  }
}
