// ══════════════════════════════════════════════════════════
// GARIHA — Modèles de données
// Tous les modèles sont prêts pour le backend (fromJson/toJson)
// ══════════════════════════════════════════════════════════

// ── Utilisateur ───────────────────────────────────────────
class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String address;
  final String parkingName;
  final String nbrOfPlaces;
  final String pricePerHour;
  final String localisation;
  final String subscription;
  final DateTime memberSince;
  final String avatarUrl;

  const UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone = '',
    this.address = '',
    this.parkingName = '',
    this.nbrOfPlaces = '',
    this.pricePerHour = '',
    this.localisation = '',
    this.subscription = 'Regular',
    required this.memberSince,
    this.avatarUrl = '',
  });

  // TODO: brancher avec le backend
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      parkingName: json['parking_name'] ?? '',
      nbrOfPlaces: json['nbr_of_places']?.toString() ?? '',
      pricePerHour: json['price_per_hour']?.toString() ?? '',
      localisation: json['localisation'] ?? '',
      subscription: json['subscription'] ?? 'Regular',
      memberSince:
          DateTime.tryParse(json['member_since'] ?? '') ?? DateTime.now(),
      avatarUrl: json['avatar_url'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'phone': phone,
    'address': address,
    'parking_name': parkingName,
    'nbr_of_places': nbrOfPlaces,
    'price_per_hour': pricePerHour,
    'localisation': localisation,
    'subscription': subscription,
    'member_since': memberSince.toIso8601String(),
    'avatar_url': avatarUrl,
  };
}

// ── Parking ───────────────────────────────────────────────
class ParkingModel {
  final String id;
  final String name;
  final double lat;
  final double lng;
  final double pricePerHour;
  final int availablePlaces;
  final int totalPlaces;
  final bool isCovered;
  final bool isSecure;
  final double distanceKm; // calculé côté client ou backend
  final String durationText; // ex: "1m30"

  const ParkingModel({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.pricePerHour,
    required this.availablePlaces,
    required this.totalPlaces,
    required this.isCovered,
    required this.isSecure,
    this.distanceKm = 0,
    this.durationText = '',
  });

  factory ParkingModel.fromJson(Map<String, dynamic> json) {
    return ParkingModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      pricePerHour: (json['price_per_hour'] as num).toDouble(),
      availablePlaces: json['available_places'] ?? 0,
      totalPlaces: json['total_places'] ?? 0,
      isCovered: json['is_covered'] ?? false,
      isSecure: json['is_secure'] ?? false,
      distanceKm: (json['distance_km'] as num?)?.toDouble() ?? 0,
      durationText: json['duration_text'] ?? '',
    );
  }

  String get priceLabel => '${pricePerHour.toInt()} DZD/H';
  String get distanceLabel =>
      '${distanceKm.toStringAsFixed(1)}Km - $durationText';
}

// ── Réservation ───────────────────────────────────────────
class ReservationModel {
  final String id;
  final String parkingId;
  final String parkingName;
  final String vehicleName;
  final DateTime timeIn;
  final DateTime timeOut;
  final int durationMinutes;
  final double initialCost;
  final double finalCost;
  final String status; // 'active' | 'completed' | 'cancelled'
  final String paymentMethod; // 'cash' | 'digital'
  final String? cardId;

  const ReservationModel({
    required this.id,
    required this.parkingId,
    required this.parkingName,
    required this.vehicleName,
    required this.timeIn,
    required this.timeOut,
    required this.durationMinutes,
    required this.initialCost,
    required this.finalCost,
    required this.status,
    required this.paymentMethod,
    this.cardId,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    return ReservationModel(
      id: json['id'] ?? '',
      parkingId: json['parking_id'] ?? '',
      parkingName: json['parking_name'] ?? '',
      vehicleName: json['vehicle_name'] ?? '',
      timeIn: DateTime.parse(json['time_in']),
      timeOut: DateTime.parse(json['time_out']),
      durationMinutes: json['duration_minutes'] ?? 0,
      initialCost: (json['initial_cost'] as num).toDouble(),
      finalCost: (json['final_cost'] as num).toDouble(),
      status: json['status'] ?? 'active',
      paymentMethod: json['payment_method'] ?? 'cash',
      cardId: json['card_id'],
    );
  }

  // Getters utiles
  String get timeInLabel =>
      '${timeIn.hour}h${timeIn.minute.toString().padLeft(2, '0')}';
  String get timeOutLabel =>
      '${timeOut.hour}h${timeOut.minute.toString().padLeft(2, '0')}';
  String get durationLabel =>
      '${durationMinutes ~/ 60}h${(durationMinutes % 60).toString().padLeft(2, '0')}min';
  String get costLabel => '${finalCost.toInt()}DZD';
  bool get isActive => status == 'active';

  // Temps restant en minutes
  int get remainingMinutes {
    final remaining = timeOut.difference(DateTime.now()).inMinutes;
    return remaining < 0 ? 0 : remaining;
  }

  // Progress pour CircularTimer (0.0 → 1.0)
  double get timerProgress {
    if (durationMinutes == 0) return 0;
    return remainingMinutes / durationMinutes;
  }

  String get remainingLabel {
    final h = remainingMinutes ~/ 60;
    final m = remainingMinutes % 60;
    return h > 0 ? '${h}h${m.toString().padLeft(2, '0')}min' : '${m}min';
  }

  // Calcul refund selon temps depuis booking
  double refundPercentage(DateTime bookedAt) {
    final minutesSince = DateTime.now().difference(bookedAt).inMinutes;
    if (minutesSince < 30) return 100;
    if (minutesSince < 60) return 75;
    if (minutesSince < 120) return 50;
    return 25;
  }
}

// ── Paiement ──────────────────────────────────────────────
class PaymentRecord {
  final String id;
  final DateTime date;
  final String parkingName;
  final String parkingId;
  final String location;
  final String time;
  final double price;
  final String vehicleName;
  final String reservationId;

  const PaymentRecord({
    required this.id,
    required this.date,
    required this.parkingName,
    required this.parkingId,
    required this.location,
    required this.time,
    required this.price,
    required this.vehicleName,
    required this.reservationId,
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: json['id'] ?? '',
      date: DateTime.parse(json['date']),
      parkingName: json['parking_name'] ?? '',
      parkingId: json['parking_id'] ?? '',
      time: json['time'] ?? '',
      location: json['location'] ?? '',
      price: (json['price'] as num).toDouble(),
      vehicleName: json['vehicle_name'] ?? '',
      reservationId: json['reservation_id'] ?? '',
    );
  }

  String get dateLabel =>
      '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  String get priceLabel => '${price.toInt()}DZD';
}

// ── Carte bancaire ────────────────────────────────────────
class CardModel {
  final String id;
  final String lastFour;
  final String expiry;
  final String holderName;
  final String type; // 'visa' | 'baridimob' | 'mastercard'

  const CardModel({
    required this.id,
    required this.lastFour,
    required this.expiry,
    required this.holderName,
    required this.type,
  });

  factory CardModel.fromJson(Map<String, dynamic> json) {
    return CardModel(
      id: json['id'] ?? '',
      lastFour: json['last_four'] ?? '',
      expiry: json['expiry'] ?? '',
      holderName: json['holder_name'] ?? '',
      type: json['type'] ?? 'visa',
    );
  }
}

// ── Notification setting ──────────────────────────────────
class NotificationSettings {
  bool spotOpens;
  bool realTimeAlerts;
  bool timeReminder;
  bool repeatAlert;
  bool smartFrequency;

  NotificationSettings({
    this.spotOpens = false,
    this.realTimeAlerts = true,
    this.timeReminder = true,
    this.repeatAlert = false,
    this.smartFrequency = true,
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      spotOpens: json['spot_opens'] ?? false,
      realTimeAlerts: json['real_time_alerts'] ?? true,
      timeReminder: json['time_reminder'] ?? true,
      repeatAlert: json['repeat_alert'] ?? false,
      smartFrequency: json['smart_frequency'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'spot_opens': spotOpens,
    'real_time_alerts': realTimeAlerts,
    'time_reminder': timeReminder,
    'repeat_alert': repeatAlert,
    'smart_frequency': smartFrequency,
  };
}
