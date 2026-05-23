import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:async'; // TimeoutException
import 'dart:io'; // SocketException
import 'package:provider/provider.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/button.dart';
import '../core/widgets/payment_method_toggle.dart';
import 'locationPrefernces_screen.dart';
import '../core/widgets/visa_payment_sheet.dart';
import '../core/widgets/baridimob_payment_sheet.dart';
import 'home_screen.dart';
import 'payments_screen.dart';
import 'history_screen.dart';
import 'reservation_screen.dart';
import 'settings_screen.dart';
import '../core/widgets/map.dart';
import '../core/data/user_session.dart';
import '../core/data/app_models.dart';
import '../core/data/api_service.dart';

enum MapState { browse, booking, confirm }

class ParkingSpot {
  final String name;
  final String pricePerHour;
  final int availablePlaces;
  final String distance;
  final bool isCovered;
  final bool isSecure;
  const ParkingSpot({
    required this.name,
    required this.pricePerHour,
    required this.availablePlaces,
    required this.distance,
    required this.isCovered,
    required this.isSecure,
  });
}

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  // ── État ───────────────────────────────────────────────
  MapState _mapState = MapState.browse;

  // ── Données backend ────────────────────────────────────
  final TextEditingController _searchCtrl = TextEditingController();

  // Contrôleur partagé avec GarihaMap pour déplacer la carte
  final MapController _mapController = MapController();

  // État de recherche
  bool _isSearching = false;
  String? _searchError;

  int? _selectedParkingId = 4; // default to Bougie Park (id 4)

  ParkingSpot selectedParking = const ParkingSpot(
    name: 'Bougie Park',
    pricePerHour: '50 DZD/H',
    availablePlaces: 67,
    distance: '2Km - 1m30',
    isCovered: true,
    isSecure: true,
  );

  double estimatedTotal = 75;
  double _parkingDuration = 0.35;
  String _durationLabel = '1h42min';

  PaymentMethod _paymentMethod = PaymentMethod.cash;
  int _selectedCardIndex = 0;

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red,
      ),
    );
  }

  // APRÈS — utilise DigitalPaymentType, compatible avec tous les callbacks
  final List<SavedCardOption> _savedCards = const [
    SavedCardOption(type: DigitalPaymentType.baridimob),
    SavedCardOption(type: DigitalPaymentType.visa),
  ];

  // Recherche une adresse via Nominatim (OpenStreetMap, gratuit)
  // Priorise l'Algérie, supporte français et arabe
  // Prend le meilleur résultat et déplace la carte
  Future<void> _searchLocation(String query) async {
    if (query.trim().isEmpty) return;

    setState(() {
      _isSearching = true;
      _searchError = null;
    });

    try {
      // countrycodes=dz → priorise l'Algérie
      // accept-language=fr,ar → supporte français et arabe
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/search'
        '?q=${Uri.encodeComponent(query)}'
        '&format=json'
        '&limit=1'
        '&countrycodes=dz'
        '&accept-language=fr,ar',
      );

      final response = await http
          .get(uri, headers: {'User-Agent': 'GarihaApp/1.0'})
          .timeout(const Duration(seconds: 8));

      if (!mounted) return;

      final results = jsonDecode(response.body) as List;

      if (results.isEmpty) {
        setState(() => _searchError = 'Adresse introuvable');
        return;
      }

      final best = results.first;
      final lat = double.parse(best['lat'] as String);
      final lng = double.parse(best['lon'] as String);
      final target = LatLng(lat, lng);

      // Déplace la carte vers le résultat avec zoom 15
      _mapController.move(target, 15.0);
    } on SocketException {
      if (mounted) setState(() => _searchError = 'Pas de connexion internet');
    } on TimeoutException {
      if (mounted) setState(() => _searchError = 'Délai dépassé, réessaye');
    } catch (e) {
      if (mounted) setState(() => _searchError = 'Erreur inattendue');
    } finally {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _onNavItemSelected(int index) {
    final screens = [
      const HomeScreen(),
      const MapScreen(),
      const PaymentsScreen(),
      const HistoryScreen(),
      const ReservationsScreen(),
      const SettingsScreen(),
    ];
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => screens[index]),
    );
  }

  void _onSliderChanged(double val) {
    setState(() {
      _parkingDuration = val;
      final totalMinutes = (val * 180).round();
      final h = totalMinutes ~/ 60;
      final m = totalMinutes % 60;
      _durationLabel = h > 0
          ? '${h}h${m.toString().padLeft(2, '0')}min'
          : '${m}min';
      
      double price = 50;
      try {
        price = double.parse(selectedParking.pricePerHour.replaceAll(RegExp(r'[^0-9]'), ''));
      } catch (_) {}
      
      estimatedTotal = ((totalMinutes / 60) * price).roundToDouble();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GarihaScaffold(
      currentNavIndex: 1,
      onNavItemSelected: _onNavItemSelected,
      child: Column(
        children: [
          GarihaAppBar(onInfoTap: () {}, onProfileTap: () {}),

          // Barre de recherche
          // APRÈS
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _SearchBar(
              controller: _searchCtrl,
              isLoading: _isSearching, // ← spinner pendant recherche
              errorText: _searchError, // ← message d'erreur sous la barre
              onSearch: _searchLocation, // ← déclenché à la soumission
            ),
          ),

          const SizedBox(height: 20),

          // Carte
          // APRÈS
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 26),
            child: GarihaMap(
              controller: _mapController, // ← controller partagé
              onParkingSelected: (p) {
                setState(() {
                  _selectedParkingId = int.tryParse(p.id) ?? 4;
                  selectedParking = ParkingSpot(
                    name: p.name,
                    pricePerHour: p.pricePerHour,
                    availablePlaces: p.availablePlaces,
                    distance: '2Km - 1m30',
                    isCovered: p.isCovered,
                    isSecure: p.isSecure,
                  );
                  double price = 50;
                  try {
                    price = double.parse(p.pricePerHour.replaceAll(RegExp(r'[^0-9]'), ''));
                  } catch (_) {}
                  final totalMinutes = (_parkingDuration * 180).round();
                  estimatedTotal = ((totalMinutes / 60) * price).roundToDouble();
                });
              },
            ),
          ),

          // Card inférieure selon l'état
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 26),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 280),
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.08),
                      end: Offset.zero,
                    ).animate(anim),
                    child: child,
                  ),
                ),
                child: _buildBottomCard(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomCard() {
    switch (_mapState) {
      case MapState.browse:
        return _BrowseCard(
          key: const ValueKey('browse'),
          parking: selectedParking,
          estimatedTotal: estimatedTotal,
          onBookNow: () => setState(() => _mapState = MapState.booking),
          onEditPrefs: () {},
        );
      // APRÈS — onConfirm vérifie si Visa est sélectionné
      case MapState.booking:
        return _BookingCard(
          key: const ValueKey('booking'),
          durationLabel: _durationLabel,
          sliderValue: _parkingDuration,
          paymentMethod: _paymentMethod,
          savedCards: _savedCards,
          selectedCardIndex: _selectedCardIndex,
          onSliderChanged: _onSliderChanged,
          onMethodChanged: (m) => setState(() => _paymentMethod = m),
          onCardSelected: (i) => setState(() => _selectedCardIndex = i),
          // APRÈS — ajouter le case BaridiMob
          onConfirm: () async {
            if (_paymentMethod == PaymentMethod.digital) {
              final cardType = _savedCards[_selectedCardIndex].type;

              // ── Visa → mock form ──────────────────────────
              if (cardType == DigitalPaymentType.visa) {
                final paid = await showVisaPaymentSheet(
                  context,
                  total: estimatedTotal,
                  parkingName: selectedParking.name,
                );
                if (paid && mounted)
                  setState(() => _mapState = MapState.confirm);
                return;
              }

              // ── BaridiMob → QR + pending ──────────────────
              if (cardType == DigitalPaymentType.baridimob) {
                final status = await showBaridimobPaymentSheet(
                  context,
                  total: estimatedTotal,
                  parkingName: selectedParking.name,
                );
                // pending = l'utilisateur a déclaré avoir payé
                if (status == PaymentStatus.pending && mounted) {
                  setState(() => _mapState = MapState.confirm);
                }
                return;
              }
            }
            // Cash → flow normal inchangé
            setState(() => _mapState = MapState.confirm);
          },
        );
      case MapState.confirm:
        return _ConfirmCard(
          key: const ValueKey('confirm'),
          savedCards: _savedCards,
          selectedCardIndex: _selectedCardIndex,
          paymentMethod: _paymentMethod,
          onMethodChanged: (m) => setState(() => _paymentMethod = m),
          onCardSelected: (i) => setState(() => _selectedCardIndex = i),
          onConfirm: () async {
            final durationMins = (_parkingDuration * 180).round();
            if (durationMins <= 0) return;

            final session = context.read<UserSession>();
            final driverName = '${session.userName} ${session.userLastName}'.trim();
            final plateNumber = session.currentUser?.localisation ?? 'P 406';

            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (ctx) => const Center(child: CircularProgressIndicator()),
            );

            try {
              final parkingId = _selectedParkingId ?? 4;
              final spotsRes = await ApiService.instance.getParkingSpots(parkingId);
              
              if (spotsRes['success'] != true || spotsRes['data'] is! List) {
                Navigator.pop(context);
                _showError('Failed to retrieve parking spots');
                return;
              }

              final List spots = spotsRes['data'];
              final libreSpot = spots.firstWhere(
                (s) => s['status'] == 'LIBRE',
                orElse: () => null,
              );

              if (libreSpot == null) {
                Navigator.pop(context);
                _showError('No spots available in this parking');
                return;
              }

              final spotId = libreSpot['id'] as int;

              final res = await ApiService.instance.createReservation(
                parkingSpotId: spotId,
                driverName: driverName.isNotEmpty ? driverName : 'Driver',
                plateNumber: plateNumber,
                durationMinutes: durationMins,
              );

              Navigator.pop(context);

              if (res['success'] == true && res['data'] != null) {
                final data = res['data'];
                session.activeReservation = ReservationModel(
                  id: data['id'].toString(),
                  parkingId: parkingId.toString(),
                  parkingName: selectedParking.name,
                  vehicleName: plateNumber,
                  timeIn: DateTime.tryParse(data['created_at']) ?? DateTime.now(),
                  timeOut: DateTime.tryParse(data['expires_at']) ?? DateTime.now().add(Duration(minutes: durationMins)),
                  durationMinutes: durationMins,
                  initialCost: estimatedTotal,
                  finalCost: estimatedTotal,
                  status: 'active',
                  paymentMethod: _paymentMethod == PaymentMethod.cash ? 'cash' : 'digital',
                  cardId: _paymentMethod == PaymentMethod.digital
                      ? _savedCards[_selectedCardIndex].label
                      : null,
                );

                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const ReservationsScreen()),
                );
              } else {
                _showError(res['message'] ?? 'Reservation failed');
              }
            } catch (e) {
              Navigator.pop(context);
              _showError('An error occurred: $e');
            }
          },
        );
    }
  }
}

// ══════════════════════════════════════════════════════════
// Barre de recherche
// ══════════════════════════════════════════════════════════
// APRÈS — gère loading, erreur, et soumission
class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final bool isLoading;
  final String? errorText;
  final ValueChanged<String> onSearch;

  const _SearchBar({
    required this.controller,
    required this.onSearch,
    this.isLoading = false,
    this.errorText,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 38,
          width: 300,
          decoration: BoxDecoration(
            color: AppColors.bgWhite,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: AppColors.darkBlue.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            style: const TextStyle(fontSize: 13, color: AppColors.darkBlue),
            textInputAction:
                TextInputAction.search, // ← clavier affiche "Rechercher"
            onSubmitted: onSearch, // ← déclenche la recherche
            decoration: InputDecoration(
              hintText: 'Where do you want to Park ?',
              hintStyle: const TextStyle(
                fontSize: 13,
                color: Color.fromARGB(255, 188, 188, 188),
              ),
              prefixIcon: isLoading
                  ? const Padding(
                      // ← spinner pendant recherche
                      padding: EdgeInsets.all(10),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : const Icon(
                      Icons.search,
                      color: Color.fromARGB(255, 188, 188, 188),
                    ),
              suffixIcon: isLoading
                  ? null
                  : GestureDetector(
                      // ← bouton GO à droite
                      onTap: () => onSearch(controller.text),
                      child: const Icon(
                        Icons.arrow_forward_ios,
                        size: 14,
                        color: Color.fromARGB(255, 188, 188, 188),
                      ),
                    ),
              border: const OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(30)),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 6),
              fillColor: Colors.white,
            ),
          ),
        ),

        // Message d'erreur sous la barre (visible seulement si erreur)
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              errorText!,
              style: const TextStyle(fontSize: 11, color: Colors.red),
            ),
          ),
      ],
    );
  }
}

//------------------------Map-------------------
class FullMapScreen extends StatelessWidget {
  const FullMapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final LatLng center = LatLng(36.7525, 3.04197);

    return Scaffold(
      appBar: AppBar(title: const Text("Map")),
      body: Stack(
        children: [
          FlutterMap(
            options: MapOptions(initialCenter: center, initialZoom: 14),
            children: [
              TileLayer(
                urlTemplate:
                    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                subdomains: const ['a', 'b', 'c'],
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: center,
                    width: 50,
                    height: 50,
                    child: const Icon(
                      Icons.location_on,
                      color: Colors.red,
                      size: 40,
                    ),
                  ),
                ],
              ),
            ],
          ),

          /// زر location
          Positioned(
            bottom: 20,
            right: 20,
            child: FloatingActionButton(
              mini: true,
              onPressed: () {},
              child: const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );
  }
}

class MiniMapWidget extends StatelessWidget {
  const MiniMapWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final LatLng center = LatLng(36.7525, 3.04197);

    return GestureDetector(
      onTap: () {
        print("clicked");
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const FullMapScreen()),
        );
      },
      child: Container(
        height: 200,
        // width: 200,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 10),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: FlutterMap(
            options: MapOptions(
              initialCenter: center,
              initialZoom: 13,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.none, // ❌ disable move
              ),
            ),
            children: [
              TileLayer(
                urlTemplate:
                    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                subdomains: const ['a', 'b', 'c'],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// État 1 : Browse
// ══════════════════════════════════════════════════════════
class _BrowseCard extends StatelessWidget {
  final ParkingSpot parking;
  final double estimatedTotal;
  final VoidCallback onBookNow;
  final VoidCallback onEditPrefs;

  const _BrowseCard({
    super.key,
    required this.parking,
    required this.estimatedTotal,
    required this.onBookNow,
    required this.onEditPrefs,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
        decoration: BoxDecoration(
          color: AppColors.bgWhite,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color.fromARGB(60, 0, 0, 0),
              blurRadius: 30,
              offset: const Offset(6, 6),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Colonne gauche
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  GarihaButton(
                    label: 'BOOK NOW !',
                    onPressed: onBookNow,
                    isBook: true,
                    width: 160,
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'Estimated total :',
                    style: TextStyle(
                      fontFamily: "Outfit",
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      color: AppColors.mediumBlue,
                    ),
                  ),
                  ShaderMask(
                    shaderCallback: (bounds) =>
                        AppColors.reverse.createShader(bounds),
                    child: Text(
                      '${estimatedTotal.toInt()} DZD',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color.fromARGB(255, 255, 255, 255),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  GarihaButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const LocationPreferencesScreen(
                            initialLocation: LatLng(36.75, 3.04),
                          ),
                        ),
                      );
                    },
                    label: 'Edit location\nand\n preferences',
                    isOutlined: true,
                    width: 138,
                  ),
                ],
              ),
            ),

            const SizedBox(width: 6),

            // Colonne droite — infos parking
            Container(
              height: 205,
              width: 135,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: const Color.fromARGB(60, 0, 0, 0),
                    offset: Offset(5, 5),
                    blurRadius: 6,
                    spreadRadius: 1,
                  ),
                ],
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    parking.name,
                    style: const TextStyle(
                      fontSize: 20,
                      fontFamily: "Afacad",
                      fontWeight: FontWeight.bold,
                      color: AppColors.textWhite,
                    ),
                  ),
                  Text(
                    '(${parking.pricePerHour})',
                    style: TextStyle(
                      fontSize: 13,
                      fontFamily: "Outfit",
                      color: AppColors.textWhite,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${parking.availablePlaces} AVAILABLE PLACES',
                    style: const TextStyle(
                      fontSize: 12,
                      fontFamily: "Afacad",
                      fontWeight: FontWeight.w700,
                      color: AppColors.darkBlue,
                    ),
                  ),
                  Text(
                    'Distance : ${parking.distance}',
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: "Afacad",
                      color: AppColors.darkBlue,
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (parking.isCovered) _Feature(label: 'Covered'),
                  if (parking.isSecure) _Feature(label: 'Secure'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Feature extends StatelessWidget {
  final String label;
  const _Feature({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          SvgPicture.asset("theme/icons/Icon (8).svg"),
          const SizedBox(width: 7),
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontFamily: "Afacad",
              fontWeight: FontWeight.bold,
              color: AppColors.textWhite,
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// État 2 : Booking
// ══════════════════════════════════════════════════════════
class _BookingCard extends StatelessWidget {
  final String durationLabel;
  final double sliderValue;
  final PaymentMethod paymentMethod;
  final List<SavedCardOption> savedCards;
  final int selectedCardIndex;
  final ValueChanged<double> onSliderChanged;
  final ValueChanged<PaymentMethod> onMethodChanged;
  final ValueChanged<int> onCardSelected;
  final VoidCallback onConfirm;

  const _BookingCard({
    super.key,
    required this.durationLabel,
    required this.sliderValue,
    required this.paymentMethod,
    required this.savedCards,
    required this.selectedCardIndex,
    required this.onSliderChanged,
    required this.onMethodChanged,
    required this.onCardSelected,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.bgWhite,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.darkBlue.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            GarihaButton(
              label: 'BOOK THE SPOT',
              onPressed: () {},
              isBook: true,
            ),
            const SizedBox(height: 16),

            if (paymentMethod == PaymentMethod.cash) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Parking duration: ',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: "Afacad",
                      fontWeight: FontWeight.w600,
                      color: AppColors.darkBlue,
                    ),
                  ),
                  ShaderMask(
                    shaderCallback: (bounds) =>
                        AppColors.reverse.createShader(bounds),
                    child: Text(
                      durationLabel,
                      style: const TextStyle(
                        fontSize: 14,
                        fontFamily: "Afacad",
                        fontWeight: FontWeight.w600,
                        color: Color.fromARGB(255, 255, 255, 255),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              SizedBox(
                width: 210,
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: AppColors.primaryCyan,
                    inactiveTrackColor: AppColors.tableRowBg,
                    thumbColor: AppColors.primaryCyan,
                    overlayColor: const Color.fromARGB(25, 69, 189, 225),
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 7,
                    ),
                    overlayShape: SliderComponentShape.noOverlay,
                    trackHeight: 7,
                  ),
                  child: Slider(value: sliderValue, onChanged: onSliderChanged),
                ),
              ),
              const SizedBox(height: 5),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    SizedBox(width: 35),
                    Text(
                      '0h',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                    SizedBox(width: 48),
                    Text(
                      '1h',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                    SizedBox(width: 50),
                    Text(
                      '2h',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                    SizedBox(width: 50),
                    Text(
                      '3h',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16), // ← ce SizedBox aussi conditionnel
            ],

            // const SizedBox(height: 16),

            PaymentMethodToggle(
              selectedMethod: paymentMethod,
              savedCards: savedCards,
              selectedCardIndex: selectedCardIndex,
              onMethodChanged: onMethodChanged,
              onCardSelected: onCardSelected,
            ),

            const SizedBox(height: 12),

            GestureDetector(
              onTap: onConfirm,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset("theme/icons/Icon (11).svg"),
                  SizedBox(width: 8),
                  Text(
                    'CONFIRM TRANSACTION',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.darkBlue,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// État 3 : Confirm paiement
// ══════════════════════════════════════════════════════════
class _ConfirmCard extends StatelessWidget {
  final List<SavedCardOption> savedCards;
  final int selectedCardIndex;
  final PaymentMethod paymentMethod;
  final ValueChanged<PaymentMethod> onMethodChanged;
  final ValueChanged<int> onCardSelected;
  final VoidCallback onConfirm;

  const _ConfirmCard({
    super.key,
    required this.savedCards,
    required this.selectedCardIndex,
    required this.paymentMethod,
    required this.onMethodChanged,
    required this.onCardSelected,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.bgWhite,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.darkBlue.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            GarihaButton(label: 'BOOK THE SPOT', onPressed: () {}),
            const SizedBox(height: 20),
            PaymentMethodToggle(
              selectedMethod: paymentMethod,
              savedCards: savedCards,
              selectedCardIndex: selectedCardIndex,
              onMethodChanged: onMethodChanged,
              onCardSelected: onCardSelected,
            ),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: onConfirm,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SvgPicture.asset("theme/icons/Icon (11).svg"),
                  SizedBox(width: 8),
                  Text(
                    'CONFIRM TRANSACTION',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.darkBlue,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
