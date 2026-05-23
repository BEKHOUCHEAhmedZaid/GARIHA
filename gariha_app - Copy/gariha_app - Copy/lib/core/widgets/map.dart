
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:ui' as ui;
import '../theme/colors.dart';
import '../data/api_service.dart';

// ══════════════════════════════════════════════════════════
// Modèle Parking — prêt pour le backend
// ══════════════════════════════════════════════════════════
class ParkingMarker {
  final String id;
  final String name;
  final double lat;
  final double lng;
  final String pricePerHour; // ex: "50 DZD/H"
  final int availablePlaces;
  final bool isCovered;
  final bool isSecure;

  const ParkingMarker({
    required this.id,
    required this.name,
    required this.lat,
    required this.lng,
    required this.pricePerHour,
    required this.availablePlaces,
    required this.isCovered,
    required this.isSecure,
  });

  // TODO: remplacer par ParkingMarker.fromJson(Map<String, dynamic> json)
  // quand le backend sera prêt
}

// ══════════════════════════════════════════════════════════
// Données parking locales (à remplacer par API)
// ══════════════════════════════════════════════════════════
final List<ParkingMarker> localParkingData = [
  ParkingMarker(
    id: '1',
    name: 'PlayLand Parking',
    lat: 36.7520,
    lng: 5.0574,
    pricePerHour: '50 DZD/H',
    availablePlaces: 45,
    isCovered: false,
    isSecure: true,
  ),
  ParkingMarker(
    id: '2',
    name: 'Parking Public Payant',
    lat: 36.7558,
    lng: 5.0812,
    pricePerHour: '30 DZD/H',
    availablePlaces: 67,
    isCovered: false,
    isSecure: false,
  ),
  ParkingMarker(
    id: '3',
    name: 'Parking Auto Centre',
    lat: 36.7571,
    lng: 5.0835,
    pricePerHour: '60 DZD/H',
    availablePlaces: 20,
    isCovered: true,
    isSecure: true,
  ),
  ParkingMarker(
    id: '4',
    name: 'Bougie Park',
    lat: 36.7490,
    lng: 5.0650,
    pricePerHour: '50 DZD/H',
    availablePlaces: 67,
    isCovered: true,
    isSecure: true,
  ),
  ParkingMarker(
    id: '5',
    name: 'Parking Gare Ferroviaire',
    lat: 36.7580,
    lng: 5.0870,
    pricePerHour: '40 DZD/H',
    availablePlaces: 30,
    isCovered: false,
    isSecure: true,
  ),
];

// ══════════════════════════════════════════════════════════
// GarihaMap — widget carte principal
// ══════════════════════════════════════════════════════════
// APRÈS
class GarihaMap extends StatefulWidget {
  final ValueChanged<ParkingMarker>? onParkingSelected;
  final double? height;
  final bool fullscreen;
  final MapController?
  controller; // ← nouveau : permet à MapScreen de contrôler la carte

  const GarihaMap({
    super.key,
    this.onParkingSelected,
    this.height,
    this.fullscreen = false,
    this.controller, // ← nouveau
  });

  @override
  State<GarihaMap> createState() => _GarihaMapState();
}

class _GarihaMapState extends State<GarihaMap> {
  // Utilise le controller externe s'il est fourni, sinon crée le sien
  late final MapController _mapController =
      widget.controller ?? MapController(); // ← modifié

  // ── Centre par défaut : PlayLand Béjaïa ───────────────
  static const LatLng _defaultCenter = LatLng(36.7520, 5.0574);
  static const double _defaultZoom = 14.5;

  // ── Parking sélectionné ───────────────────────────────
  ParkingMarker? _selectedParking;

  // ── Liste des parkings (TODO: charger depuis API) ──────
  List<ParkingMarker> _parkings = localParkingData;

  @override
  void initState() {
    super.initState();
    _loadParkings();
  }

  Future<void> _loadParkings() async {
    try {
      final res = await ApiService.instance.getPublicParkings();
      if (res['success'] == true && res['data'] is List) {
        final List list = res['data'];
        if (list.isNotEmpty) {
          setState(() {
            _parkings = list.map((item) {
              return ParkingMarker(
                id: item['id'].toString(),
                name: item['parking_name'] ?? 'Unknown Parking',
                lat: (item['lat'] as num?)?.toDouble() ?? 36.7520,
                lng: (item['lng'] as num?)?.toDouble() ?? 5.0574,
                pricePerHour: item['pricing'] ?? '50 DZD/H',
                availablePlaces: (item['available_places'] as num?)?.toInt() ?? 0,
                isCovered: true,
                isSecure: true,
              );
            }).toList();
          });
        }
      }
    } catch (e) {
      debugPrint('[GarihaMap] Error loading parkings: $e');
    }
  }

  // ── Centrer sur ma position ────────────────────────────
  void _centerOnDefault() {
    _mapController.move(_defaultCenter, _defaultZoom);
  }

  // ── Sélectionner un parking ───────────────────────────
  void _onMarkerTap(ParkingMarker parking) {
    setState(() => _selectedParking = parking);
    _mapController.move(LatLng(parking.lat, parking.lng), 15.5);
    widget.onParkingSelected?.call(parking);
  }

  // ── Ouvrir en plein écran ─────────────────────────────
  void _openFullscreen(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _FullscreenMapPage(
          initialCenter: _selectedParking != null
              ? LatLng(_selectedParking!.lat, _selectedParking!.lng)
              : _defaultCenter,
          parkings: _parkings,
          onParkingSelected: (p) {
            setState(() => _selectedParking = p);
            widget.onParkingSelected?.call(p);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mapWidget = _buildMap(context);

    if (widget.fullscreen) return mapWidget;

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: widget.height ?? 200,
        child: Stack(
          children: [
            mapWidget,

            // ── Bouton plein écran ──────────────────────
            Positioned(
              top: 8,
              right: 8,
              child: _MapIconButton(
                icon: Icons.fullscreen,
                onTap: () => _openFullscreen(context),
              ),
            ),

            // ── Bouton recentrer ────────────────────────
            Positioned(
              bottom: 8,
              right: 8,
              child: _MapIconButton(
                icon: Icons.my_location,
                onTap: _centerOnDefault,
                isPrimary: true,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMap(BuildContext context) {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _defaultCenter,
        initialZoom: _defaultZoom,
        minZoom: 10,
        maxZoom: 18,
        onTap: (_, __) => setState(() => _selectedParking = null),
      ),
      children: [
        // ── Tiles OpenStreetMap ─────────────────────────
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.gariha.app',
          maxZoom: 19,
        ),

        // ── Markers parking ─────────────────────────────
        MarkerLayer(
          markers: _parkings.map((parking) {
            final isSelected = _selectedParking?.id == parking.id;
            return Marker(
              point: LatLng(parking.lat, parking.lng),
              width: isSelected ? 48 : 36,
              height: isSelected ? 48 : 36,
              child: GestureDetector(
                onTap: () => _onMarkerTap(parking),
                child: _ParkingMarkerWidget(
                  isSelected: isSelected,
                  availablePlaces: parking.availablePlaces,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════
// Marker visuel parking
// ══════════════════════════════════════════════════════════
class _ParkingMarkerWidget extends StatelessWidget {
  final bool isSelected;
  final int availablePlaces;

  const _ParkingMarkerWidget({
    required this.isSelected,
    required this.availablePlaces,
  });

  @override
  Widget build(BuildContext context) {
    final size = isSelected ? 52.0 : 36.0;
    final pinColor = isSelected
        ? const Color(0xFF00D4FF)
        : const Color(0xFF1A3A6B);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      width: size,
      height: size,
      child: Icon(
        Icons.location_on,
        color: pinColor,
        size: size,
        shadows: [
          Shadow(
            color: pinColor.withOpacity(0.4),
            blurRadius: isSelected ? 12 : 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
    );
  }
}
// ══════════════════════════════════════════════════════════
// Bouton icône sur la carte
// ══════════════════════════════════════════════════════════
class _MapIconButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const _MapIconButton({
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  State<_MapIconButton> createState() => _MapIconButtonState();
}

class _MapIconButtonState extends State<_MapIconButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 100),
    lowerBound: 0.0,
    upperBound: 0.08,
  );

  late final Animation<double> _scale = Tween<double>(
    begin: 1.0,
    end: 0.92,
  ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) => _ctrl.reverse(),
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: widget.isPrimary
                ? const LinearGradient(
                    colors: [Color(0xFF00D4FF), Color(0xFF2B5BA8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: widget.isPrimary ? null : Colors.white,
            boxShadow: widget.isPrimary
                ? [
                    BoxShadow(
                      color: const Color(0xFF00D4FF).withOpacity(0.35),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: const Color(0xFF1A3A6B).withOpacity(0.2),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
          ),
          child: Icon(
            widget.icon,
            size: 22,
            color: widget.isPrimary ? Colors.white : const Color(0xFF2B5BA8),
          ),
        ),
      ),
    );
  }
}
// ══════════════════════════════════════════════════════════
// Page plein écran de la carte
// ══════════════════════════════════════════════════════════
class _FullscreenMapPage extends StatefulWidget {
  final LatLng initialCenter;
  final List<ParkingMarker> parkings;
  final ValueChanged<ParkingMarker>? onParkingSelected;

  const _FullscreenMapPage({
    required this.initialCenter,
    required this.parkings,
    this.onParkingSelected,
  });

  @override
  State<_FullscreenMapPage> createState() => _FullscreenMapPageState();
}

class _FullscreenMapPageState extends State<_FullscreenMapPage> {
  final MapController _mapController = MapController();
  ParkingMarker? _selectedParking;

  void _onMarkerTap(ParkingMarker parking) {
    setState(() => _selectedParking = parking);
    _mapController.move(LatLng(parking.lat, parking.lng), 16.0);
    widget.onParkingSelected?.call(parking);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // ── Carte plein écran ──────────────────────────
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: widget.initialCenter,
              initialZoom: 15.0,
              minZoom: 10,
              maxZoom: 19,
              onTap: (_, __) => setState(() => _selectedParking = null),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.gariha.app',
                maxZoom: 19,
              ),
              MarkerLayer(
                markers: widget.parkings.map((parking) {
                  final isSelected = _selectedParking?.id == parking.id;
                  return Marker(
                    point: LatLng(parking.lat, parking.lng),
                    width: isSelected ? 52 : 40,
                    height: isSelected ? 52 : 40,
                    child: GestureDetector(
                      onTap: () => _onMarkerTap(parking),
                      child: _ParkingMarkerWidget(
                        isSelected: isSelected,
                        availablePlaces: parking.availablePlaces,
                      ),
                    ),
                  );
                }).toList(),
              ),
              // if (_selectedParking != null)
              //   MarkerLayer(
              //     markers: [
              //       Marker(
              //         point: LatLng(
              //           _selectedParking!.lat - 0.0025,
              //           _selectedParking!.lng,
              //         ),
              //         width: 220,
              //         height: 100,
              //         child: _ParkingInfoPopup(parking: _selectedParking!),
              //       ),
              //     ],
              //   ),
            ],
          ),

          // ── Header plein écran ─────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 8,
                left: 16,
                right: 16,
                bottom: 12,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.white, Colors.white.withOpacity(0.0)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Row(
                children: [
                  // Bouton retour
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.12),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.arrow_back_ios_new,
                        size: 18,
                        color: Color(0xFF1A3A6B),
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Titre
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.search,
                            color: Color(0xFF6B7A99),
                            size: 18,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Parkings à Béjaïa',
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF6B7A99),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Bouton recentrer ───────────────────────────
          Positioned(
            bottom: 30,
            right: 16,
            child: _MapIconButton(
              icon: Icons.my_location,
              isPrimary: true,
              onTap: () => _mapController.move(widget.initialCenter, 15.0),
            ),
          ),

          // ── Compteur parkings ──────────────────────────
          Positioned(
            bottom: 30,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.local_parking,
                    color: Color(0xFF00D4FF),
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${widget.parkings.length} parkings',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1A3A6B),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
