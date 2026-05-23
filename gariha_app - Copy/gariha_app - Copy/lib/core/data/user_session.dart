// import 'package:flutter/foundation.dart';
// import 'app_models.dart';

// class UserSession extends ChangeNotifier {
//   UserSession._internal();
//   static final UserSession instance = UserSession._internal();

//   // ── Données utilisateur ──
//   UserModel? _currentUser; // rempli au login/signup
//   ReservationModel? _activeReservation; // réservation en cours
//   List<PaymentRecord> _paymentHistory = [];
//   List<CardModel> _savedCards = [];
//   NotificationSettings _notifSettings = NotificationSettings();

//   UserModel? get currentUser => _currentUser;
//   set currentUser(UserModel? value) {
//     _currentUser = value;
//     notifyListeners();
//   }

//   ReservationModel? get activeReservation => _activeReservation;
//   set activeReservation(ReservationModel? value) {
//     _activeReservation = value;
//     notifyListeners();
//   }

//   List<PaymentRecord> get paymentHistory => _paymentHistory;
//   set paymentHistory(List<PaymentRecord> value) {
//     _paymentHistory = value;
//     notifyListeners();
//   }

//   List<CardModel> get savedCards => _savedCards;
//   set savedCards(List<CardModel> value) {
//     _savedCards = value;
//     notifyListeners();
//   }

//   NotificationSettings get notifSettings => _notifSettings;
//   set notifSettings(NotificationSettings value) {
//     _notifSettings = value;
//     notifyListeners();
//   }

//   // ── Getters & Setters pratiques pour compatibilité ──
//   String get userName => _currentUser?.firstName ?? '';
//   set userName(String value) {
//     final current = _currentUser ?? UserModel(id: '', firstName: '', lastName: '', email: '', memberSince: DateTime.now());
//     currentUser = UserModel(
//       id: current.id,
//       firstName: value,
//       lastName: current.lastName,
//       email: current.email,
//       phone: current.phone,
//       address: current.address,
//       parkingName: current.parkingName,
//       nbrOfPlaces: current.nbrOfPlaces,
//       pricePerHour: current.pricePerHour,
//       localisation: current.localisation,
//       subscription: current.subscription,
//       memberSince: current.memberSince,
//       avatarUrl: current.avatarUrl,
//     );
//   }

//   String get userLastName => _currentUser?.lastName ?? '';
//   set userLastName(String value) {
//     final current = _currentUser ?? UserModel(id: '', firstName: '', lastName: '', email: '', memberSince: DateTime.now());
//     currentUser = UserModel(
//       id: current.id,
//       firstName: current.firstName,
//       lastName: value,
//       email: current.email,
//       phone: current.phone,
//       address: current.address,
//       parkingName: current.parkingName,
//       nbrOfPlaces: current.nbrOfPlaces,
//       pricePerHour: current.pricePerHour,
//       localisation: current.localisation,
//       subscription: current.subscription,
//       memberSince: current.memberSince,
//       avatarUrl: current.avatarUrl,
//     );
//   }

//   String get email => _currentUser?.email ?? '';
//   set email(String value) {
//     final current = _currentUser ?? UserModel(id: '', firstName: '', lastName: '', email: '', memberSince: DateTime.now());
//     currentUser = UserModel(
//       id: current.id,
//       firstName: current.firstName,
//       lastName: current.lastName,
//       email: value,
//       phone: current.phone,
//       address: current.address,
//       parkingName: current.parkingName,
//       nbrOfPlaces: current.nbrOfPlaces,
//       pricePerHour: current.pricePerHour,
//       localisation: current.localisation,
//       subscription: current.subscription,
//       memberSince: current.memberSince,
//       avatarUrl: current.avatarUrl,
//     );
//   }

//   String get memberSince {
//     final d = _currentUser?.memberSince;
//     if (d == null) return '';
//     return '${_monthName(d.month)} ${d.year}';
//   }

//   String _monthName(int m) => [
//     '',
//     'Jan',
//     'Feb',
//     'Mar',
//     'Apr',
//     'May',
//     'Jun',
//     'Jul',
//     'Aug',
//     'Sep',
//     'Oct',
//     'Nov',
//     'Dec',
//   ][m];

//   void clear() {
//     _currentUser = null;
//     _activeReservation = null;
//     _paymentHistory = [];
//     _savedCards = [];
//     _notifSettings = NotificationSettings();
//     notifyListeners();
//   }
// }




import 'app_models.dart';
import 'package:flutter/foundation.dart';

// ══════════════════════════════════════════════════════════
// UserSession — singleton qui partage les données
// entre toutes les pages de l'application.
//
// IMPORTANT : ne contient JAMAIS de données hardcodées.
// Toutes les données viennent du backend via AuthService.
// ══════════════════════════════════════════════════════════
class UserSession extends ChangeNotifier {
  UserSession._internal();
  static final UserSession instance = UserSession._internal();

  // ── Données utilisateur (remplies par AuthService) ─────
  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  set currentUser(UserModel? value) {
    _currentUser = value;
    notifyListeners();
  }

  // ── Réservation active ─────────────────────────────────
  ReservationModel? _activeReservation;
  ReservationModel? get activeReservation => _activeReservation;
  set activeReservation(ReservationModel? value) {
    _activeReservation = value;
    notifyListeners();
  }

  // ── Historique paiements ───────────────────────────────
  List<PaymentRecord> _paymentHistory = [];
  List<PaymentRecord> get paymentHistory => _paymentHistory;
  set paymentHistory(List<PaymentRecord> value) {
    _paymentHistory = value;
    notifyListeners();
  }

  // ── Cartes bancaires ───────────────────────────────────
  List<CardModel> _savedCards = [];
  List<CardModel> get savedCards => _savedCards;
  set savedCards(List<CardModel> value) {
    _savedCards = value;
    notifyListeners();
  }

  // ── Paramètres notifications ───────────────────────────
  NotificationSettings notifSettings = NotificationSettings();

  // ══════════════════════════════════════════════════════
  // Getters — utilisés dans toutes les pages
  // Retournent '' si currentUser est null (jamais de crash)
  // ══════════════════════════════════════════════════════
  String get userName     => currentUser?.firstName  ?? '';
  String get userLastName => currentUser?.lastName   ?? '';
  String get email        => currentUser?.email      ?? '';
  String get phone        => currentUser?.phone      ?? '';
  String get avatarUrl    => currentUser?.avatarUrl  ?? '';
  String get subscription => currentUser?.subscription ?? 'Regular';
  bool   get isLoggedIn   => currentUser != null;

  String get memberSince {
    final d = currentUser?.memberSince;
    if (d == null) return '';
    return '${_monthName(d.month)} ${d.year}';
  }

  String _monthName(int m) => [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ][m];

  // ══════════════════════════════════════════════════════
  // Getters Home Screen
  // Calculés depuis paymentHistory quand backend branché
  // ══════════════════════════════════════════════════════
  String get totalTimeParked {
    if (paymentHistory.isEmpty) return '0h';
    // TODO: calculer depuis paymentHistory
    return '0h';
  }

  String get mostFrequented {
    if (paymentHistory.isEmpty) return '-';
    // TODO: calculer le parking le plus fréquenté
    return '-';
  }

  String get currentSpot =>
      activeReservation?.isActive == true
          ? activeReservation!.parkingName
          : '-';

  List<Map<String, dynamic>> get monthlyData {
    // TODO: calculer depuis paymentHistory groupé par mois
    return [
      {'month': 'Jan', 'spots': 0, 'max': 1},
      {'month': 'Feb', 'spots': 0, 'max': 1},
      {'month': 'Mar', 'spots': 0, 'max': 1},
    ];
  }

  // ══════════════════════════════════════════════════════
  // clear() — appelé au logout
  // Remet tout à zéro sans aucune valeur par défaut
  // ══════════════════════════════════════════════════════
  void clear() {
    currentUser       = null;
    activeReservation = null;
    paymentHistory    = [];
    savedCards        = [];
    notifSettings     = NotificationSettings();
  }
}