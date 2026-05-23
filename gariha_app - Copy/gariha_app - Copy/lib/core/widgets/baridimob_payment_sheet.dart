import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../theme/colors.dart';

// ══════════════════════════════════════════════════════════
// BaridiMob Payment Sheet — solution réaliste Algérie
//
// Pas d'API BaridiMob (aucune API publique n'existe).
// Flow réel utilisé par les boutiques algériennes :
//   1. Afficher étapes guidées + QR code + CCP explicite
//   2. Client scanne ou copie les infos dans BaridiMob
//   3. Client clique "J'ai payé"
//   4. Statut → pending (admin confirme manuellement)
//
// Pour brancher une vraie API plus tard → remplacer _onPaid()
//
// Utilisation :
//   final status = await showBaridimobPaymentSheet(
//     context, total: 75.0, parkingName: 'Bougie Park',
//   );
//   if (status == PaymentStatus.pending) { ... }
// ══════════════════════════════════════════════════════════

// ── Statut paiement — cohérent avec backend futur ─────────
enum PaymentStatus {
  pending, // en attente de confirmation admin
  confirmed, // paiement vérifié
  rejected, // paiement rejeté
  cancelled, // utilisateur a fermé sans payer
}

// ── Infos CCP statiques (remplacer par les vraies en prod) ─
const _ccpNumber = '00799999';
const _ccpKey = '99';
const _beneficiary = 'GARIHA SARL';
const _motif = 'Réservation parking GARIHA';
const _qrBaseData = 'CCP:00799999;BEN:GARIHA SARL;MOTIF:PARKING';

// ══════════════════════════════════════════════════════════
// Fonction publique — inchangée
// ══════════════════════════════════════════════════════════
Future<PaymentStatus> showBaridimobPaymentSheet(
  BuildContext context, {
  required double total,
  required String parkingName,
}) async {
  final result = await showModalBottomSheet<PaymentStatus>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) =>
        _BaridimobPaymentSheet(total: total, parkingName: parkingName),
  );
  return result ?? PaymentStatus.cancelled;
}

// ══════════════════════════════════════════════════════════
// Widget principal — inchangé structurellement
// ══════════════════════════════════════════════════════════
class _BaridimobPaymentSheet extends StatefulWidget {
  final double total;
  final String parkingName;

  const _BaridimobPaymentSheet({
    required this.total,
    required this.parkingName,
  });

  @override
  State<_BaridimobPaymentSheet> createState() => _BaridimobPaymentSheetState();
}

enum _SheetState { qr, pending }

class _BaridimobPaymentSheetState extends State<_BaridimobPaymentSheet>
    with SingleTickerProviderStateMixin {
  _SheetState _state = _SheetState.qr;

  late final AnimationController _pendingAnim = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 700),
  );
  late final Animation<double> _pendingScale = CurvedAnimation(
    parent: _pendingAnim,
    curve: Curves.elasticOut,
  );

  @override
  void dispose() {
    _pendingAnim.dispose();
    super.dispose();
  }

  String get _qrData =>
      '$_qrBaseData;MNT:${widget.total.toInt()};REF:${widget.parkingName.replaceAll(' ', '_').toUpperCase()}';

  // Copie toutes les infos de paiement en un seul tap
  void _copyAllPaymentInfo() {
    final info =
        'Paiement BaridiMob — GARIHA\n'
        'Bénéficiaire : $_beneficiary\n'
        'N° CCP       : $_ccpNumber — Clé $_ccpKey\n'
        'Montant      : ${widget.total.toInt()},00 DZD\n'
        'Motif        : $_motif';
    Clipboard.setData(ClipboardData(text: info));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white, size: 16),
            SizedBox(width: 8),
            Text('Infos de paiement copiées !'),
          ],
        ),
        backgroundColor: Color(0xFF007A3D),
        duration: Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // L'utilisateur déclare avoir payé → statut pending
  Future<void> _onPaid() async {
    setState(() => _state = _SheetState.pending);
    _pendingAnim.forward();

    // TODO: appeler le backend ici
    // await PaymentApi.createPending(total: widget.total, method: 'baridimob');

    await Future.delayed(const Duration(milliseconds: 2500));
    if (mounted) Navigator.pop(context, PaymentStatus.pending);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 320),
      transitionBuilder: (child, anim) => FadeTransition(
        opacity: anim,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.06),
            end: Offset.zero,
          ).animate(anim),
          child: child,
        ),
      ),
      child: _state == _SheetState.qr ? _buildQrSheet() : _buildPendingSheet(),
    );
  }

  // ── Écran QR — UX améliorée ───────────────────────────
  Widget _buildQrSheet() {
    return Container(
      key: const ValueKey('qr'),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _SheetHandle(),
            const SizedBox(height: 18),

            _BaridimobHeader(
              parkingName: widget.parkingName,
              total: widget.total,
            ),

            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 18),

            // ── NOUVEAU : Bloc étapes guidées ────────────
            _StepsGuide(),

            const SizedBox(height: 18),
            const Divider(height: 1),
            const SizedBox(height: 18),

            // ── QR code + label explicite ────────────────
            const Text(
              'QR Code de paiement',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A3A6B),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Ouvrez BaridiMob → Paiement → Scanner ce code',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textMuted,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 14),

            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFF007A3D).withOpacity(0.3),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF007A3D).withOpacity(0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: QrImageView(
                data: _qrData,
                version: QrVersions.auto,
                size: 170,
                backgroundColor: Colors.white,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: Color(0xFF007A3D),
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Color(0xFF1A3A6B),
                ),
              ),
            ),

            // ── NOUVEAU : Données QR visibles et lisibles ─
            const SizedBox(height: 10),
            _QrDataVisible(qrData: _qrData),

            const SizedBox(height: 16),

            // Infos CCP
            _CcpInfoBox(total: widget.total),

            const SizedBox(height: 14),

            // ── NOUVEAU : Bouton copier tout ─────────────
            _CopyAllButton(onTap: _copyAllPaymentInfo),

            // ── NOUVEAU : Bouton instruction BaridiMob ────
            const SizedBox(height: 10),
            _BaridimobInstructionButton(),

            const SizedBox(height: 20),

            // Bouton "J'ai payé"
            _PaidButton(onPressed: _onPaid),

            const SizedBox(height: 10),
            const Text(
              'Votre réservation sera confirmée après vérification du virement',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  // ── Écran Pending — inchangé ──────────────────────────
  Widget _buildPendingSheet() {
    return Container(
      key: const ValueKey('pending'),
      height: 340,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ScaleTransition(
            scale: _pendingScale,
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFC200), Color(0xFFFFAB00)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFFC200).withOpacity(0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.access_time_rounded,
                color: Colors.white,
                size: 38,
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Déclaration envoyée !',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1A3A6B),
            ),
          ),
          const SizedBox(height: 10),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'Un administrateur vérifiera votre virement BaridiMob '
              'et confirmera votre réservation dans les plus brefs délais.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textMuted,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Badge pending
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFFFC200), width: 1),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.circle, size: 8, color: Color(0xFFFFC200)),
                SizedBox(width: 6),
                Text(
                  'Status : PENDING',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFE65100),
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// NOUVEAU — Bloc étapes guidées step-by-step
// Montre à l'utilisateur exactement quoi faire
// ══════════════════════════════════════════════════════════
class _StepsGuide extends StatelessWidget {
  const _StepsGuide();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F8F4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF007A3D).withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.info_outline, size: 14, color: Color(0xFF007A3D)),
              SizedBox(width: 6),
              Text(
                'Comment payer avec BaridiMob',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF007A3D),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _Step(number: '1', text: 'Ouvrez votre application BaridiMob'),
          _Step(number: '2', text: 'Allez dans "Paiement" puis "Scanner QR"'),
          _Step(
            number: '3',
            text:
                'Scannez le QR code ci-dessous\n'
                'OU saisissez le numéro CCP manuellement',
          ),
          _Step(
            number: '4',
            text:
                'Entrez le montant exact : '
                '\$MONTANT DZD et confirmez',
            highlight: true,
          ),
          _Step(
            number: '5',
            text: 'Revenez ici et cliquez "J\'ai effectué le paiement"',
            isLast: true,
          ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final String number;
  final String text;
  final bool highlight;
  final bool isLast;

  const _Step({
    required this.number,
    required this.text,
    this.highlight = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Numéro cercle
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: highlight
                  ? const Color(0xFF007A3D)
                  : const Color(0xFF007A3D).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: highlight ? Colors.white : const Color(0xFF007A3D),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                height: 1.45,
                fontWeight: highlight ? FontWeight.w700 : FontWeight.w400,
                color: highlight
                    ? const Color(0xFF007A3D)
                    : const Color(0xFF1A3A6B),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// NOUVEAU — Données QR visibles et lisibles
// L'utilisateur voit exactement ce qui est encodé dans le QR
// ══════════════════════════════════════════════════════════
class _QrDataVisible extends StatelessWidget {
  final String qrData;

  const _QrDataVisible({required this.qrData});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Clipboard.setData(ClipboardData(text: qrData));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Données QR copiées'),
            duration: Duration(seconds: 1),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFF7F8FC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFE0E4EF), width: 1),
        ),
        child: Row(
          children: [
            const Icon(Icons.qr_code_2, size: 14, color: AppColors.textMuted),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                qrData,
                style: const TextStyle(
                  fontSize: 9.5,
                  color: AppColors.textMuted,
                  fontFamily: 'monospace',
                  letterSpacing: 0.2,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            const Icon(
              Icons.copy_rounded,
              size: 12,
              color: AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// NOUVEAU — Bouton "Copier toutes les infos de paiement"
// ══════════════════════════════════════════════════════════
class _CopyAllButton extends StatelessWidget {
  final VoidCallback onTap;

  const _CopyAllButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: const Icon(
          Icons.copy_all_rounded,
          size: 16,
          color: Color(0xFF007A3D),
        ),
        label: const Text(
          'Copier les infos de paiement',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Color(0xFF007A3D),
          ),
        ),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
          side: const BorderSide(color: Color(0xFF007A3D), width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          backgroundColor: const Color(0xFFF1F8F4),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// NOUVEAU — Bouton instruction "Comment ouvrir BaridiMob"
// Affiche un dialog d'aide — pas de deeplink (non supporté)
// ══════════════════════════════════════════════════════════
class _BaridimobInstructionButton extends StatelessWidget {
  const _BaridimobInstructionButton();

  void _showInstruction(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.smartphone, color: Color(0xFF007A3D), size: 20),
            SizedBox(width: 8),
            Text(
              'Ouvrir BaridiMob',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1A3A6B),
              ),
            ),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sur votre téléphone :',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textMuted,
              ),
            ),
            SizedBox(height: 10),
            _InstructionLine(
              icon: Icons.apps,
              text: 'Quittez cette app momentanément',
            ),
            _InstructionLine(
              icon: Icons.search,
              text: 'Cherchez "BaridiMob" sur votre écran',
            ),
            _InstructionLine(
              icon: Icons.touch_app,
              text: 'Ouvrez l\'app et allez dans "Paiement"',
            ),
            _InstructionLine(
              icon: Icons.qr_code_scanner,
              text: 'Tapez "Scanner QR" et scannez le code',
            ),
            _InstructionLine(
              icon: Icons.check_circle_outline,
              text: 'Confirmez le montant et validez',
            ),
            SizedBox(height: 8),
            Text(
              'Puis revenez ici pour confirmer votre paiement.',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textMuted,
                height: 1.4,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Compris',
              style: TextStyle(
                color: Color(0xFF007A3D),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        onPressed: () => _showInstruction(context),
        icon: const Icon(
          Icons.help_outline,
          size: 15,
          color: AppColors.textMuted,
        ),
        label: const Text(
          'Comment utiliser BaridiMob ?',
          style: TextStyle(
            fontSize: 12,
            color: AppColors.textMuted,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 10),
        ),
      ),
    );
  }
}

class _InstructionLine extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InstructionLine({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF007A3D)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF1A3A6B),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Bouton principal "J'ai effectué le paiement"
// ══════════════════════════════════════════════════════════
class _PaidButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _PaidButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF007A3D), Color(0xFF00A651)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF007A3D).withOpacity(0.35),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
              SizedBox(width: 8),
              Text(
                "J'ai effectué le paiement",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Widgets internes réutilisables — inchangés
// ══════════════════════════════════════════════════════════
class _SheetHandle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: Colors.grey.shade300,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }
}

class _BaridimobHeader extends StatelessWidget {
  final String parkingName;
  final double total;

  const _BaridimobHeader({required this.parkingName, required this.total});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF007A3D), Color(0xFFFFC200)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.account_balance,
            color: Colors.white,
            size: 22,
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'BaridiMob',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFF007A3D),
              ),
            ),
            Text(
              parkingName,
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
          ],
        ),
        const Spacer(),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${total.toInt()} DZD',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Color(0xFF007A3D),
              ),
            ),
            const Text(
              'À payer',
              style: TextStyle(fontSize: 10, color: AppColors.textMuted),
            ),
          ],
        ),
      ],
    );
  }
}

class _CcpInfoBox extends StatelessWidget {
  final double total;

  const _CcpInfoBox({required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F8F4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF007A3D).withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          _CcpRow(
            label: 'Numéro CCP',
            value: '$_ccpNumber — Clé $_ccpKey',
            copyable: true,
            copyValue: _ccpNumber,
          ),
          const SizedBox(height: 8),
          _CcpRow(label: 'Bénéficiaire', value: _beneficiary),
          const SizedBox(height: 8),
          _CcpRow(label: 'Motif', value: _motif),
          const SizedBox(height: 8),
          _CcpRow(
            label: 'Montant EXACT',
            value: '${total.toInt()},00 DZD',
            highlight: true,
            copyable: true,
            copyValue: '${total.toInt()}',
          ),
        ],
      ),
    );
  }
}

class _CcpRow extends StatelessWidget {
  final String label;
  final String value;
  final String? copyValue;
  final bool copyable;
  final bool highlight;

  const _CcpRow({
    required this.label,
    required this.value,
    this.copyValue,
    this.copyable = false,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
        ),
        Row(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: highlight
                    ? const Color(0xFF007A3D)
                    : const Color(0xFF1A3A6B),
              ),
            ),
            if (copyable) ...[
              const SizedBox(width: 6),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: copyValue ?? value));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('$label copié !'),
                      duration: const Duration(seconds: 1),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                child: const Icon(
                  Icons.copy_rounded,
                  size: 14,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
