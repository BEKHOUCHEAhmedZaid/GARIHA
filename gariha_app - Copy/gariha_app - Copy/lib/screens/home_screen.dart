import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../core/data/app_models.dart';
import '../core/data/user_session.dart';
import '../core/data/api_service.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/button.dart';
import 'map_screen.dart';
import 'payments_screen.dart';
import 'history_screen.dart';
import 'reservation_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String totalTimeParked = '0h';
  String mostFrequented = '-';

  List<Map<String, dynamic>> monthlyData = [
    {'month': 'Jan', 'spots': 0, 'max': 1},
    {'month': 'Feb', 'spots': 0, 'max': 1},
    {'month': 'Mar', 'spots': 0, 'max': 1},
  ];

  @override
  void initState() {
    super.initState();
    _loadStatsAndActiveReservation();
  }

  Future<void> _loadStatsAndActiveReservation() async {
    final session = context.read<UserSession>();
    
    try {
      final activeRes = await ApiService.instance.getActiveReservation();
      if (activeRes['success'] == true && activeRes['data'] != null && activeRes['data']['active'] == true) {
        final data = activeRes['data']['reservation'];
        final DateTime start = DateTime.parse(data['created_at']);
        final DateTime end = DateTime.parse(data['expires_at']);
        final duration = end.difference(start).inMinutes;

        session.activeReservation = ReservationModel(
          id: data['id'].toString(),
          parkingId: data['parking_spot_id'].toString(),
          parkingName: data['parking_name'] ?? 'Unknown Parking',
          vehicleName: data['plate_number'] ?? 'P 406',
          timeIn: start,
          timeOut: end,
          durationMinutes: duration,
          initialCost: (data['spot_price'] ?? 50.0).toDouble() * (duration / 60.0),
          finalCost: (data['spot_price'] ?? 50.0).toDouble() * (duration / 60.0),
          status: data['status'] ?? 'active',
          paymentMethod: 'cash',
        );
      } else {
        session.activeReservation = null;
      }
    } catch (e) {
      debugPrint('[HomeScreen] Error loading active reservation: $e');
    }

    try {
      final historyRes = await ApiService.instance.getReservationHistory();
      if (historyRes['success'] == true && historyRes['data'] is List) {
        final List list = historyRes['data'];
        
        double totalMins = 0;
        final Map<String, int> frequencies = {};
        final Map<String, int> monthsCount = {'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0, 'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0};

        for (var item in list) {
          try {
            final DateTime start = DateTime.parse(item['created_at']);
            final DateTime end = DateTime.parse(item['expires_at']);
            totalMins += end.difference(start).inMinutes;

            final String pName = item['parking_name'] ?? 'City Parking';
            frequencies[pName] = (frequencies[pName] ?? 0) + 1;

            final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            final mName = months[start.month - 1];
            monthsCount[mName] = (monthsCount[mName] ?? 0) + 1;
          } catch (_) {}
        }

        String mostFrequentedVal = '-';
        int maxFreq = 0;
        frequencies.forEach((k, v) {
          if (v > maxFreq) {
            maxFreq = v;
            mostFrequentedVal = k;
          }
        });

        final now = DateTime.now();
        final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        final m1 = months[now.subtract(const Duration(days: 60)).month - 1];
        final m2 = months[now.subtract(const Duration(days: 30)).month - 1];
        final m3 = months[now.month - 1];

        final c1 = monthsCount[m1] ?? 0;
        final c2 = monthsCount[m2] ?? 0;
        final c3 = monthsCount[m3] ?? 0;
        
        int maxVal = [c1, c2, c3, 1].reduce((value, element) => value > element ? value : element);

        setState(() {
          totalTimeParked = '${(totalMins / 60).toStringAsFixed(1)}h';
          mostFrequented = mostFrequentedVal;
          monthlyData = [
            {'month': m1, 'spots': c1, 'max': maxVal},
            {'month': m2, 'spots': c2, 'max': maxVal},
            {'month': m3, 'spots': c3, 'max': maxVal},
          ];
        });
      }
    } catch (e) {
      debugPrint('[HomeScreen] Error loading history statistics: $e');
    }
  }

  void _onFindVehicle() {
    // TODO: naviguer vers la carte avec localisation du véhicule
    debugPrint('Find my vehicle tapped');
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

    Navigator.of(
      context,
      rootNavigator: true,
    ).pushReplacement(MaterialPageRoute(builder: (context) => HomeScreen()));
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => screens[index]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<UserSession>();
    final userName = session.userName;
    final userLastName = session.userLastName;
    final currentSpot = session.activeReservation?.parkingName ?? '-';

    return GarihaScaffold(
      currentNavIndex: 0,
      onNavItemSelected: _onNavItemSelected,
      child: Column(
        children: [
          GarihaAppBar(onInfoTap: () {}, onProfileTap: () {}),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  _WelcomeSection(
                    userName: userName,
                    userLastName: userLastName,
                  ),
                  const SizedBox(height: 20),
                  _MonthlyActivityCard(
                    totalTimeParked: totalTimeParked,
                    mostFrequented: mostFrequented,
                    monthlyData: monthlyData,
                  ),
                  const SizedBox(height: 20),
                  Align(
                    alignment: Alignment.center,
                    child: GarihaButton(
                      label: "Find my vehicle",
                      onPressed: _onFindVehicle,
                      svg: "theme/icons/navigation.svg",
                      width: 185,
                    ),
                  ),
                  const SizedBox(height: 28),
                  _CurrentSpotSection(spotName: currentSpot),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


class _WelcomeSection extends StatelessWidget {
  final String userName;
  final String userLastName;

  const _WelcomeSection({required this.userName, required this.userLastName});

  @override
  Widget build(BuildContext context) {
    return ShaderMask(
      shaderCallback: (bounds) =>
          AppColors.welcome.createShader(bounds),
      child: Text(
        "Welcome Back\n $userName $userLastName",
        style: TextStyle(
          fontSize: 30,
          fontWeight: FontWeight.bold,
          fontFamily: 'Afacad',
          color: Colors.white,
          height: 1.2,
        ),
      ),
    );
  }
}

class _MonthlyActivityCard extends StatelessWidget {
  final String totalTimeParked;
  final String mostFrequented;
  final List<Map<String, dynamic>> monthlyData;

  const _MonthlyActivityCard({
    required this.totalTimeParked,
    required this.mostFrequented,
    required this.monthlyData,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 18),
      width: double.infinity,
      // padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 18),
      padding: const EdgeInsets.only(bottom: 22, left: 18, top: 8),

      decoration: BoxDecoration(
        color: AppColors.bgWhite,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: const Color.fromARGB(60, 0, 0, 0),
            offset: Offset(5, 5),
            spreadRadius: 0,
            blurRadius: 15,
          ),
        ],
      ),
      child: Column(
        
        children: [
          Center(
            child: ShaderMask(
              shaderCallback: (bounds) =>
                  AppColors.monthly.createShader(bounds),
              child: Text(
                "Monthly Activity Summary",
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Afacad',
                  color: Colors.white,
                ),
              ),
            ),
          ),

          const SizedBox(height: 14),
          Row(
            children: [
              // Total Time
              Expanded(
                child: Row(
                  children: [
                    SvgPicture.asset("theme/icons/horloge.svg", height: 27),
                    const SizedBox(width: 2),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Time Parked:\n $totalTimeParked',
                            style: TextStyle(
                              letterSpacing: 0.1,
                              fontFamily: 'Afacad',
                              fontSize: 16,
                              color: AppColors.text,
                              height: 1.1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              // Most Frequented
              Expanded(
                child: Row(
                  children: [
                    SvgPicture.asset("theme/icons/mark.svg", height: 25),
                    const SizedBox(width: 3),

                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Most Frequented:\n$mostFrequented',
                            style: TextStyle(
                              height: 1.1,
                              letterSpacing: 0.1,
                              fontFamily: 'Afacad',
                              fontSize: 16,
                              color: AppColors.text,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          SizedBox(height: 15),

          // ── Sous-titre graphique ──
          const Text(
            'Over Last Three Months',
            style: TextStyle(
              fontFamily: 'Afacad',
              fontSize: 19,
              color: Color.fromARGB(225, 13, 28, 110),
            ),
          ),

          const SizedBox(height: 12),

          // ── Barres mensuelles ──
          ...monthlyData.map(
            (data) => _MonthBar(
              month: data['month'] as String,
              spots: data['spots'] as int,
              maxSpots: data['max'] as int,
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthBar extends StatelessWidget {
  final String month;
  final int spots;
  final int maxSpots;

  const _MonthBar({
    required this.month,
    required this.spots,
    required this.maxSpots,
  });

  @override
  Widget build(BuildContext context) {
    final double maxWidth = 200;
    final double ratio = maxSpots == 0 ? 0 : spots / maxSpots;
    final double barWidth = maxWidth * ratio;

    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              month,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.text,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: barWidth,
            height: 10,
            decoration: BoxDecoration(
              gradient: AppColors.statistic,
              borderRadius: BorderRadius.circular(6),
            ),
          ),

          const SizedBox(width: 5),

          Text(
            '$spots spots',
            style: TextStyle(fontSize: 12, color: AppColors.small),
          ),
        ],
      ),
    );
  }
}

class _CurrentSpotSection extends StatelessWidget {
  final String spotName;

  const _CurrentSpotSection({required this.spotName});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Text(
          'Current Parking Spot:',
          style: TextStyle(
            fontSize: 32,
            fontFamily: "Afacad",
            fontWeight: FontWeight.w500,
            color: AppColors.text,
          ),
        ),

        ShaderMask(
          shaderCallback: (bounds) => AppColors.park.createShader(bounds),
          child: Text(
            spotName,
            style: const TextStyle(
              fontSize: 32,
              fontFamily: "Afacad",
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}
