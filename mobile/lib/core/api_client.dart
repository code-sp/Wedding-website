import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

class SessionUser {
  const SessionUser({
    required this.id,
    required this.role,
    required this.clientId,
    required this.isProfileComplete,
    this.name,
  });

  final String id;
  final String? name;
  final String role;
  final String clientId;
  final bool isProfileComplete;

  factory SessionUser.fromJson(Map<String, dynamic> json) => SessionUser(
        id: json['id'] as String,
        name: json['name'] as String?,
        role: json['role'] as String,
        clientId: json['clientId'] as String? ?? 'default_client',
        isProfileComplete: json['isProfileComplete'] as bool? ?? false,
      );
}

class WeddingApiClient {
  WeddingApiClient({String baseUrl = 'http://localhost:3000/api'})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 15),
          headers: const {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(CookieManager(_cookieJar));
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final method = options.method.toUpperCase();
          final isMutation = !const {'GET', 'HEAD', 'OPTIONS'}.contains(method);
          final isLogin = options.path.endsWith('/session/login');

          if (isMutation && !isLogin) {
            final cookies = await _cookieJar.loadForRequest(options.uri);
            for (final cookie in cookies) {
              if (cookie.name == 'csrf_token') {
                options.headers['X-CSRF-Token'] = cookie.value;
                break;
              }
            }
          }

          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final CookieJar _cookieJar = CookieJar();

  Future<SessionUser> login(String code, {String clientId = 'default_client'}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/session/login',
      data: {'code': code, 'clientId': clientId},
    );
    return SessionUser.fromJson(
      Map<String, dynamic>.from(response.data!['user'] as Map),
    );
  }

  Future<SessionUser> session() async {
    final response = await _dio.get<Map<String, dynamic>>('/session');
    return SessionUser.fromJson(
      Map<String, dynamic>.from(response.data!['user'] as Map),
    );
  }

  Future<SessionUser> refresh() async {
    final response = await _dio.post<Map<String, dynamic>>('/session/refresh');
    return SessionUser.fromJson(
      Map<String, dynamic>.from(response.data!['user'] as Map),
    );
  }

  Future<void> logout() async {
    await _dio.post<void>('/session/logout');
    await _cookieJar.deleteAll();
  }

  Future<void> completeProfile({
    required String fullName,
    required String relationToCouple,
    required String dietaryPreference,
    required String phone,
  }) async {
    await _dio.put<Map<String, dynamic>>(
      '/profile',
      data: {
        'fullName': fullName,
        'relationToCouple': relationToCouple,
        'dietaryPreference': dietaryPreference,
        'phone': phone,
      },
    );
  }
}
