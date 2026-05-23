import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/parkingtable.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'payments_screen.dart';
import 'reservation_screen.dart';
import 'settings_screen.dart';
import '../core/data/api_service.dart';

class ParkingSession {
  final String date;
  final String location;
  final String time;
  final String vehicle;
  const ParkingSession({
    required this.date,
    required this.location,
    required this.time,
    required this.vehicle,
  });
}

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  // ── Données backend ────────────────────────────────────
  String totalHoursParked = '0h';
  String averageStay = '0min';
  String mostRebooked = '-';

  List<ParkingSession> pastSessions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final res = await ApiService.instance.getReservationHistory();
      if (res['success'] == true && res['data'] is List) {
        final List list = res['data'];
        final List<ParkingSession> sessions = [];
        
        double totalMins = 0;
        final Map<String, int> frequencies = {};

        for (var item in list) {
          try {
            final DateTime start = DateTime.parse(item['created_at']);
            final DateTime end = DateTime.parse(item['expires_at']);
            final duration = end.difference(start).inMinutes;
            totalMins += duration;

            final String pName = item['parking_name'] ?? 'City Parking';
            frequencies[pName] = (frequencies[pName] ?? 0) + 1;

            final dateStr = '${start.year}-${start.month.toString().padLeft(2, '0')}-${start.day.toString().padLeft(2, '0')}';
            final timeStr = '${start.hour.toString().padLeft(2, '0')}:${start.minute.toString().padLeft(2, '0')}';

            sessions.add(ParkingSession(
              date: dateStr,
              location: pName,
              time: timeStr,
              vehicle: item['plate_number'] ?? 'P 406',
            ));
          } catch (_) {}
        }

        String mostRebookedVal = '-';
        int maxFreq = 0;
        frequencies.forEach((k, v) {
          if (v > maxFreq) {
            maxFreq = v;
            mostRebookedVal = k;
          }
        });

        setState(() {
          pastSessions = sessions;
          _isLoading = false;
          totalHoursParked = '${(totalMins / 60).toStringAsFixed(1)}h';
          averageStay = list.isNotEmpty
              ? '${(totalMins / list.length).toStringAsFixed(0)}min'
              : '0min';
          mostRebooked = mostRebookedVal;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  bool _showAllRows = false;
  static const int _defaultRowCount = 4;

  List<ParkingSession> get _visible => _showAllRows
      ? pastSessions
      : pastSessions.take(_defaultRowCount).toList();

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

  @override
  Widget build(BuildContext context) {
    return GarihaScaffold(
      currentNavIndex: 3,
      onNavItemSelected: _onNavItemSelected,
      child: Column(
        children: [
          GarihaAppBar(onInfoTap: () {}, onProfileTap: () {}),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  _UsageSummaryCard(
                    totalHours: totalHoursParked,
                    averageStay: averageStay,
                    mostRebooked: mostRebooked,
                  ),
                  const SizedBox(height: 10),
                  ShaderMask(
                    shaderCallback: (bounds) => AppColors.navtext.createShader(bounds),
                    child: const Text(
                      'Past Parking Sessions',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  
                  _isLoading
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      : _SessionsTable(
                          visibleSessions: _visible,
                          showAll: _showAllRows,
                          hasMore: pastSessions.length > _defaultRowCount,
                          onToggle: () =>
                              setState(() => _showAllRows = !_showAllRows),
                        ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UsageSummaryCard extends StatelessWidget {
  final String totalHours;
  final String averageStay;
  final String mostRebooked;

  const _UsageSummaryCard({
    required this.totalHours,
    required this.averageStay,
    required this.mostRebooked,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.usage,
        borderRadius: BorderRadius.circular(68),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: EdgeInsets.only(left: 30),
            child: const Text(
              'Usage Summary',
              style: TextStyle(
                fontFamily: "Afacad",
                fontSize: 22,
                fontWeight: FontWeight.w500,
                color: AppColors.textWhite,
              ),
            ),
          ),
          const SizedBox(height: 8),
          _SummaryRow(label: 'Total Hours Parked (All):', value: totalHours),
          const SizedBox(height: 12),
          _SummaryRow(label: 'Average Stay:', value: averageStay),
          const SizedBox(height: 12),
          _SummaryRow(label: 'Most Rebooked Spot:', value: mostRebooked),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      decoration: BoxDecoration(
        gradient: AppColors.summary,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        // mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontFamily: "Afacad",
              fontSize: 13,
              color: AppColors.textWhite,
            ),
          ),
          SizedBox(width: 35),
          Text(
            value,
            style: const TextStyle(
              fontFamily: "Afacad",
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textWhite,
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionsTable extends StatelessWidget {
  final List<ParkingSession> visibleSessions;
  final bool showAll;
  final bool hasMore;
  final VoidCallback onToggle;

  const _SessionsTable({
    required this.visibleSessions,
    required this.showAll,
    required this.hasMore,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final rows = visibleSessions
        .map(
          (s) => {
            "date": s.date,
            "location": s.location,
            "time": s.time,
            "vehicle": s.vehicle,
          },
        )
        .toList();

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // ── Table ─────────────────────────────
        Container(
          decoration: BoxDecoration(
            color: AppColors.bgWhite,
            boxShadow: [
              BoxShadow(
                color: AppColors.darkBlue.withOpacity(0.07),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: CustomTable(
            columns: const [
              TableColumn(label: 'Date', key: 'date', flex: 2),
              TableColumn(label: 'Location', key: 'location', flex: 4),
              TableColumn(label: 'Time', key: 'time', flex: 2),
              TableColumn(label: 'Vehicles', key: 'vehicle', flex: 3),
            ],
            rows: rows,
          ),
        ),

        // ── Toggle Button (floating) ─────────
        if (hasMore)
          Positioned(
            bottom: -35,
            right: 0,
            left: 0,
            child: GestureDetector(
              onTap: onToggle,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  // color: Colors.blue
                ),
                child: AnimatedRotation(
                  turns: showAll ? 0.5 : 0,
                  duration: const Duration(milliseconds: 300),
                  child: SvgPicture.asset(
                    "theme/icons/Polygon 4.svg",
                    height: 24,
                  ),
                ),
              ),
            ),
          )  
      ],
    );
  }
}
