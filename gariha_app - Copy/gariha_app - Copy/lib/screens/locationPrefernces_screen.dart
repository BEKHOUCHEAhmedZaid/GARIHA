import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

class UserPreferences {
  final LatLng location;
  final double maxDistance; // km
  final bool freeOnly;

  const UserPreferences({
    required this.location,
    required this.maxDistance,
    required this.freeOnly,
  });
}

class LocationPreferencesScreen extends StatefulWidget {
  final LatLng initialLocation;

  const LocationPreferencesScreen({super.key, required this.initialLocation});

  @override
  State<LocationPreferencesScreen> createState() =>
      _LocationPreferencesScreenState();
}

class _LocationPreferencesScreenState extends State<LocationPreferencesScreen> {
  late LatLng _selectedLocation;
  double _distance = 1; // km
  bool _freeOnly = false;

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.initialLocation;
  }

  void _onSave() {
    Navigator.pop(
      context,
      UserPreferences(
        location: _selectedLocation,
        maxDistance: _distance,
        freeOnly: _freeOnly,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Edit Location & Preferences")),
      body: Column(
        children: [
          /// 🗺️ MAP (tap to change location)
          Container(
            height: 250,
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(20)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: _selectedLocation,
                  initialZoom: 14,
                  onTap: (tapPosition, point) {
                    setState(() => _selectedLocation = point);
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                    subdomains: const ['a', 'b', 'c'],
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _selectedLocation,
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
            ),
          ),

          /// ⚙️ Preferences
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                const Text(
                  "Distance",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Slider(
                  value: _distance,
                  min: 0.5,
                  max: 5,
                  divisions: 9,
                  label: "${_distance.toStringAsFixed(1)} km",
                  onChanged: (value) {
                    setState(() => _distance = value);
                  },
                ),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("Free parking only"),
                    Switch(
                      value: _freeOnly,
                      onChanged: (val) {
                        setState(() => _freeOnly = val);
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),

      /// 💾 Save button
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          onPressed: _onSave,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: const Text("Save changes"),
        ),
      ),
    );
  }
}
