import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../core/theme/colors.dart';
import '../core/theme/scaffold.dart';
import '../core/widgets/appbar.dart';
import '../core/widgets/button.dart';
import 'home_screen.dart';
import 'map_screen.dart';
import 'payments_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';
import '../core/data/app_models.dart';
import '../core/data/user_session.dart';
import '../core/data/api_service.dart';

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  // ── Données backend ────────────────────────────────────
  String extendEndsAt = '17h42min';
  double extendFeePercent = 30;
  String extendFeeAmount = '+27DZD';
  String latestBooking = '25mins ago';
  String refundPercent = '65%';

  // ── État UI ────────────────────────────────────────────
  double _sliderValue = 0.35;
  bool _showCancellationDialog = false;

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  Future<void> _onCheckin(int resId, UserSession session) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator()),
    );
    try {
      final res = await ApiService.instance.checkinReservation(resId);
      Navigator.pop(context);
      if (res['success'] == true) {
        final current = session.activeReservation;
        if (current != null) {
          session.activeReservation = ReservationModel(
            id: current.id,
            parkingId: current.parkingId,
            parkingName: current.parkingName,
            vehicleName: current.vehicleName,
            timeIn: current.timeIn,
            timeOut: current.timeOut,
            durationMinutes: current.durationMinutes,
            initialCost: current.initialCost,
            finalCost: current.finalCost,
            status: 'checked_in',
            paymentMethod: current.paymentMethod,
            cardId: current.cardId,
          );
        }
      } else {
        _showError(res['message'] ?? 'Check-in failed');
      }
    } catch (e) {
      Navigator.pop(context);
      _showError('Error: $e');
    }
  }

  Future<void> _onCheckout(int resId, UserSession session) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator()),
    );
    try {
      final res = await ApiService.instance.checkoutReservation(resId);
      Navigator.pop(context);
      if (res['success'] == true) {
        session.activeReservation = null;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Checked out successfully')),
        );
      } else {
        _showError(res['message'] ?? 'Check-out failed');
      }
    } catch (e) {
      Navigator.pop(context);
      _showError('Error: $e');
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

  @override
  Widget build(BuildContext context) {
    final session = context.watch<UserSession>();
    final reservation = session.activeReservation;

    final spotName = reservation?.parkingName ?? '-';
    final vehicle = reservation?.vehicleName ?? '-';
    final timeIn = reservation?.timeInLabel ?? '-';
    final timeOut = reservation?.timeOutLabel ?? '-';
    final initialDuration = reservation?.durationLabel ?? '-';
    final initialCost = reservation?.costLabel ?? '-';
    final timeRemaining = reservation?.remainingLabel ?? '0min';
    final timerProgress = reservation?.timerProgress ?? 0.0;

    return GarihaScaffold(
      currentNavIndex: 4,
      onNavItemSelected: _onNavItemSelected,
      child: Stack(
        children: [
          // ── Contenu principal ──────────────────────────
          Column(
            children: [
              GarihaAppBar(onInfoTap: () {}, onProfileTap: () {}),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 26),
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      // Bouton Cancellation Options
                      InkWell(
                        onTap: () =>
                            setState(() => _showCancellationDialog = true),
                        borderRadius: BorderRadius.circular(20),
                        child: Stack(
                          clipBehavior: Clip.none,
                          alignment: Alignment.center,
                          children: [
                            GarihaButton(
                              width: 250,
                              isSecondary: true,
                              label: 'Cancellation Options',
                              onPressed: () => setState(
                                () => _showCancellationDialog = true,
                              ),
                            ),

                            Positioned(
                              bottom: -9,
                              child: SvgPicture.asset(
                                'theme/icons/Polygon 3.svg',
                                width: 15,
                                height: 15,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(height: 18),

                      // Card Extend Parking
                      _ExtendParkingCard(
                        endsAt: extendEndsAt,
                        sliderValue: _sliderValue,
                        feePercent: extendFeePercent,
                        feeAmount: extendFeeAmount,
                        onSliderChanged: (val) =>
                            setState(() => _sliderValue = val),
                      ),

                      const SizedBox(height: 20),

                      // Card Active Session
                      _ActiveSessionCard(
                        spotName: spotName,
                        timeRemaining: timeRemaining,
                        timerProgress: timerProgress,
                        vehicle: vehicle,
                        timeIn: timeIn,
                        timeOut: timeOut,
                        initialDuration: initialDuration,
                        initialCost: initialCost,
                        status: reservation?.status ?? 'active',
                        onCheckin: reservation != null && int.tryParse(reservation.id) != null
                            ? () => _onCheckin(int.parse(reservation.id), session)
                            : null,
                        onCheckout: reservation != null && int.tryParse(reservation.id) != null
                            ? () => _onCheckout(int.parse(reservation.id), session)
                            : null,
                      ),

                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // ── Dialog Cancellation par-dessus ────────────
          if (_showCancellationDialog)
            _CancellationOverlay(
              latestBooking: latestBooking,
              refundPercent: refundPercent,
              onClose: () => setState(() => _showCancellationDialog = false),
              onConfirm: () async {
                setState(() => _showCancellationDialog = false);
                final session = context.read<UserSession>();
                final activeRes = session.activeReservation;
                if (activeRes == null) return;

                final resId = int.tryParse(activeRes.id);
                if (resId == null) {
                  session.activeReservation = null;
                  return;
                }

                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (ctx) => const Center(child: CircularProgressIndicator()),
                );

                try {
                  final res = await ApiService.instance.cancelReservation(resId);
                  Navigator.pop(context);

                  if (res['success'] == true) {
                    session.activeReservation = null;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Row(
                          children: [
                            const Icon(Icons.check_circle, color: Colors.white),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Text(
                                'Reservation cancelled successfully',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                        backgroundColor: AppColors.mediumBlue,
                        behavior: SnackBarBehavior.floating,
                        margin: const EdgeInsets.all(16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 8,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  } else {
                    _showError(res['message'] ?? 'Failed to cancel reservation');
                  }
                } catch (e) {
                  Navigator.pop(context);
                  _showError('Error: $e');
                }
              },
            ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// CircularTimer
// ══════════════════════════════════════════════════════════
class _CircularTimer extends StatelessWidget {
  final String timeLabel;
  final String subLabel;
  final double progress;

  const _CircularTimer({
    required this.timeLabel,
    required this.subLabel,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 120,
            height: 120,
            child: CircularProgressIndicator(
              value: progress,
              strokeWidth: 7,
              backgroundColor: AppColors.tableRowBg,
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color.fromARGB(255, 59, 157, 211),
              ),
              strokeCap: StrokeCap.round,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                timeLabel,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.darkBlue,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subLabel,
                style: const TextStyle(
                  fontSize: 10,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Card : Extend Parking Period
// ══════════════════════════════════════════════════════════
class _ExtendParkingCard extends StatelessWidget {
  final String endsAt;
  final double sliderValue;
  final double feePercent;
  final String feeAmount;
  final ValueChanged<double> onSliderChanged;

  const _ExtendParkingCard({
    required this.endsAt,
    required this.sliderValue,
    required this.feePercent,
    required this.feeAmount,
    required this.onSliderChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 180,
      padding: const EdgeInsets.only(left: 15, right: 15, top: 5, bottom: 20),
      decoration: BoxDecoration(
        gradient: AppColors.extend,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: const Color.fromARGB(60, 0, 0, 0),
            blurRadius: 30,
            offset: const Offset(6, 6),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Extend Parking Period',
            style: TextStyle(
              fontSize: 22,
              fontFamily: "Afacad",
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          // const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ShaderMask(
                shaderCallback: (bounds) =>
                    AppColors.mixte.createShader(bounds),
                child: const Text(
                  'ENDS AT:  ',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    fontFamily: "Afacad",
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              Text(
                endsAt,
                style: const TextStyle(
                  fontSize: 14,
                  fontFamily: "Afacad",
                  fontWeight: FontWeight.w600,
                  color: Color.fromARGB(255, 255, 255, 255),
                ),
              ),
            ],
          ),

          // SizedBox(height: 4,),
          Center(
            child: SizedBox(
              width: 200,
              child: SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: Color.fromARGB(255, 64, 171, 219),
                  inactiveTrackColor: AppColors.tableRowBg,
                  thumbColor: Color.fromARGB(255, 64, 171, 219),
                  overlayColor: Color.fromARGB(
                    255,
                    60,
                    93,
                    209,
                  ).withOpacity(0.1),
                  thumbShape: const RoundSliderThumbShape(
                    enabledThumbRadius: 6,
                  ),
                  overlayShape: SliderComponentShape.noOverlay,
                  trackHeight: 6,
                ),
                child: Slider(value: sliderValue, onChanged: onSliderChanged),
              ),
            ),
          ),

          SizedBox(height: 8),
          Container(
            margin: EdgeInsets.symmetric(horizontal: 10),
            height: 3,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Color.fromARGB(255, 214, 219, 228),
              borderRadius: BorderRadius.circular(20),
            ),
          ),

          Center(
            child: ShaderMask(
              shaderCallback: (bounds) => AppColors.mixte.createShader(bounds),
              child: Text(
                'Additional Fee:',
                style: const TextStyle(
                  fontSize: 22,
                  fontFamily: "Afacad",
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          // const SizedBox(height: 4),
          Center(
            child: Text(
              '+ ${feePercent.toInt()}% of initial price  $feeAmount',
              style: const TextStyle(
                fontFamily: "Afacad",
                fontWeight: FontWeight.w600,
                fontSize: 15,
                color: Color.fromARGB(255, 61, 108, 211),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Card : Active Parking Session
// ══════════════════════════════════════════════════════════
class _ActiveSessionCard extends StatelessWidget {
  final String spotName;
  final String timeRemaining;
  final double timerProgress;
  final String vehicle;
  final String timeIn;
  final String timeOut;
  final String initialDuration;
  final String initialCost;
  final String status;
  final VoidCallback? onCheckin;
  final VoidCallback? onCheckout;

  const _ActiveSessionCard({
    required this.spotName,
    required this.timeRemaining,
    required this.timerProgress,
    required this.vehicle,
    required this.timeIn,
    required this.timeOut,
    required this.initialDuration,
    required this.initialCost,
    required this.status,
    this.onCheckin,
    this.onCheckout,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
      decoration: BoxDecoration(
        color: Color.fromARGB(255, 244, 244, 244),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: const Color.fromARGB(60, 0, 0, 0),
            blurRadius: 30,
            offset: const Offset(6, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Column(
            children: [
              const Text(
                'Active Parking Session',
                style: TextStyle(
                  fontSize: 17,
                  fontFamily: "Outfit",
                  fontWeight: FontWeight.w500,
                  color: AppColors.texts,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
                decoration: BoxDecoration(
                  gradient: AppColors.active,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  spotName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontFamily: "Afacad",
                    fontWeight: FontWeight.w500,
                    color: AppColors.textWhite,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              _CircularTimer(
                timeLabel: timeRemaining,
                subLabel: 'remaining',
                progress: timerProgress,
              ),
              const SizedBox(height: 12),
              if (status == 'active')
                ElevatedButton(
                  onPressed: onCheckin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00D4FF),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: const Text('Check In'),
                )
              else if (status == 'checked_in')
                ElevatedButton(
                  onPressed: onCheckout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: const Text('Check Out'),
                ),
            ],
          ),
          Container(
            width: 120,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: const Color.fromARGB(60, 0, 0, 0),
                  blurRadius: 6,
                  spreadRadius: 1,
                  offset: const Offset(5, 5),
                ),
              ],
              gradient: AppColors.reserve,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                _DetailRow(label: 'Vehicle', value: vehicle),
                _DetailRow(label: 'Time In', value: timeIn),
                _DetailRow(label: 'Time Out', value: timeOut),
                _DetailRow(label: 'Initial\nDuration', value: initialDuration),
                _DetailRow(
                  label: 'Initial\nCost',
                  value: initialCost,
                  isLast: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isLast;
  const _DetailRow({
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontFamily: "Afacad",
              fontSize: 13,
              color: Colors.white,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontFamily: "Afacad",
              fontSize: 13,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Overlay Cancellation Dialog
// ══════════════════════════════════════════════════════════
class _CancellationOverlay extends StatelessWidget {
  final String latestBooking;
  final String refundPercent;
  final VoidCallback onClose;
  final VoidCallback onConfirm;

  const _CancellationOverlay({
    required this.latestBooking,
    required this.refundPercent,
    required this.onClose,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onClose,
      child: Container(
        color: Color.fromARGB(108, 65, 69, 110),
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 32),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 28),
              decoration: BoxDecoration(
                gradient: AppColors.cancellation,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.darkBlue.withOpacity(0.3),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Cancellation Options',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: "Afacad",
                      fontSize: 30,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textWhite,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Latest Booking:',
                    style: TextStyle(
                      fontFamily: "Afacad",
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textWhite,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    latestBooking,
                    style: const TextStyle(
                      fontFamily: "Afacad",
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textWhite,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Refund\nPercentage:',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: "Afacad",
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textWhite,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    refundPercent,
                    style: const TextStyle(
                      fontFamily: "Afacad",
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textWhite,
                    ),
                  ),
                  const SizedBox(height: 24),
                  GestureDetector(
                    onTap: onConfirm,
                    child: Container(
                      width: 260,
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      decoration: BoxDecoration(
                        gradient: AppColors.cancellation,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: const Color.fromARGB(255, 248, 234, 234),
                            offset: Offset(1, 1),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: "Confirm ",
                              style: TextStyle(
                                fontFamily: "Afacad",
                                fontSize: 20,
                                fontWeight: FontWeight.w500,

                                color: Color.fromARGB(255, 107, 228, 252),
                                letterSpacing: 1,
                              ),
                            ),
                            TextSpan(
                              text: "Cancellation",
                              style: TextStyle(
                                fontFamily: "Afacad",
                                fontSize: 20,
                                fontWeight: FontWeight.w500,

                                color: Color.fromARGB(255, 54, 112, 215),
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Text(
                      //   'CONFIRM CANCELLATION',
                      //   textAlign: TextAlign.center,
                      //   style: TextStyle(
                      //     fontFamily: "Afacad",
                      //     fontSize: 20,
                      //     fontWeight: FontWeight.w500,

                      //     color: Color.fromARGB(255, 107, 228, 252),
                      //     letterSpacing: 1,
                      //   ),
                      // ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
