import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/parkingtable.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'history_screen.dart';
import 'reservation_screen.dart';
import 'settings_screen.dart';
import '../core/data/app_models.dart';
import '../core/data/user_session.dart';
import '../core/data/api_service.dart';
import 'package:provider/provider.dart';


class SavedCard {
  final String lastFour;
  final String expiry;
  final String holderName;
  const SavedCard({
    required this.lastFour,
    required this.expiry,
    required this.holderName,
  });
}

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  // ── Données backend ────────────────────────────────────
  final List<SavedCard> savedCards = const [
    SavedCard(lastFour: '1234', expiry: '12/28', holderName: 'GARIHA USER'),
  ];
  List<CardModel> get savedCard => context.watch<UserSession>().savedCards;

  List<PaymentRecord> get paymentHistory => context.watch<UserSession>().paymentHistory;

  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    final session = context.read<UserSession>();
    try {
      final res = await ApiService.instance.getReservationHistory();
      if (res['success'] == true && res['data'] is List) {
        final List list = res['data'];
        final List<PaymentRecord> records = [];

        for (var item in list) {
          try {
            final DateTime start = DateTime.parse(item['created_at']);
            final DateTime end = DateTime.parse(item['expires_at']);
            final duration = end.difference(start).inMinutes;
            final double price = (item['spot_price'] ?? 50.0).toDouble() * (duration / 60.0);

            final timeStr = '${start.hour.toString().padLeft(2, '0')}:${start.minute.toString().padLeft(2, '0')}';

            records.add(PaymentRecord(
              id: item['id'].toString(),
              date: start,
              parkingName: item['parking_name'] ?? 'City Parking',
              parkingId: item['parking_spot_id'].toString(),
              location: 'ESTIN-Amizour',
              time: timeStr,
              price: price,
              vehicleName: item['plate_number'] ?? 'P 406',
              reservationId: item['id'].toString(),
            ));
          } catch (_) {}
        }
        
        setState(() {
          session.paymentHistory = records;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  // final List<PaymentRecord> paymentHistory = const [
  //   PaymentRecord(
  //     date: '2026-03-08',
  //     location: 'ESTIN-Amizour',
  //     time: '14:37',
  //     price: '50DZD',
  //   ),
  //   PaymentRecord(
  //     date: '2020-03-06',
  //     location: 'National Airport-Algiers',
  //     time: '10:58',
  //     price: '900DZD',
  //   ),
  //   PaymentRecord(
  //     date: '2001-09-11',
  //     location: 'Lot F-Twins',
  //     time: '13:46',
  //     price: '120DZD',
  //   ),
  //   PaymentRecord(
  //     date: '1998-09-30',
  //     location: 'Lot B-Racoon City',
  //     time: '20:13',
  //     price: '750DZD',
  //   ),
  //   PaymentRecord(
  //     date: '2026-03-08',
  //     location: 'ESTIN-Amizour',
  //     time: '14:37',
  //     price: '50DZD',
  //   ),
  //   PaymentRecord(
  //     date: '2026-03-08',
  //     location: 'ESTIN-Amizour',
  //     time: '14:37',
  //     price: '50DZD',
  //   ),
  //   PaymentRecord(
  //     date: '2026-03-08',
  //     location: 'ESTIN-Amizour',
  //     time: '14:37',
  //     price: '50DZD',
  //   ),
  //   PaymentRecord(
  //     date: '2026-03-08',
  //     location: 'ESTIN-Amizour',
  //     time: '14:37',
  //     price: '50DZD',
  //   ),
  //   PaymentRecord(
  //     date: '2026-03-08',
  //     location: 'ESTIN-Amizour',
  //     time: '14:37',
  //     price: '50DZD',
  //   ),
  // ];

  bool _showAllRows = false;
  static const int _defaultRowCount = 4;

  List<PaymentRecord> get _visible => _showAllRows
      ? paymentHistory
      : paymentHistory.take(_defaultRowCount).toList();

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
      currentNavIndex: 2,
      onNavItemSelected: _onNavItemSelected,
      child: Column(
        children: [
          GarihaAppBar(onInfoTap: () {}, onProfileTap: () {}),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  _SavedCardsSection(cards: savedCards, onAddCard: () {}),
                  const SizedBox(height: 18),
                  _isLoading
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      : _PaymentHistoryTable(
                          visiblePayments: _visible,
                          showAll: _showAllRows,
                          hasMore: paymentHistory.length > _defaultRowCount,
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

class _SavedCardsSection extends StatelessWidget {
  final List<SavedCard> cards;
  final VoidCallback onAddCard;
  const _SavedCardsSection({required this.cards, required this.onAddCard});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(55),
      child: Container(
        width: double.infinity,
        height: 170,

        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Color.fromARGB(65, 0, 0, 0),
              blurRadius: 20,
              spreadRadius: 6,
              offset: Offset(6, 6),
            ),
          ],
          image: DecorationImage(
            image: AssetImage('theme/assets/Gariha_cards.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Saved Cards',
                    style: TextStyle(
                      fontSize: 40,
                      fontFamily: "Afacad",
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                  const Spacer(),
                  Align(
                    alignment: Alignment.centerRight,
                    child: GestureDetector(
                      onTap: onAddCard,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.bgWhite,
                          borderRadius: BorderRadius.circular(33),
                          border: Border.all(color: AppColors.bgWhite),
                          boxShadow: [
                            BoxShadow(
                              color: const Color.fromARGB(60, 0, 0, 0),
                              blurRadius: 4,
                              spreadRadius: 0,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ShaderMask(
                          shaderCallback: (bounds) =>
                              AppColors.monthly.createShader(bounds),
                          child: Text(
                            '+Add New Card',
                            style: TextStyle(
                              fontFamily: "Afacad",
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
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

class _PaymentHistoryTable extends StatelessWidget {
  final List<PaymentRecord> visiblePayments;
  final bool showAll;
  final bool hasMore;
  final VoidCallback onToggle;

  const _PaymentHistoryTable({
    required this.visiblePayments,
    required this.showAll,
    required this.hasMore,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    // data → format backend table
    final rows = visiblePayments
        .map(
          (p) => {
            "date": p.date,
            "location": p.location,
            "time": p.time,
            "price": p.price,
          },
        )
        .toList();

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // ── Table Container ─────────────────────
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
              TableColumn(label: 'Price', key: 'price', flex: 2),
            ],
            rows: rows,
          ),
        ),

        // ── Toggle Button ───────────────────────
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
                  child: SvgPicture.asset("theme/icons/Polygon 4.svg", height: 24,),
                  ),
                ),
              ),
          )    
      ],
    );
  }
}
