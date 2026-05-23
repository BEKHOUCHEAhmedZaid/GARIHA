import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/colors.dart';

// ══════════════════════════════════════════════════════════
// visaPaymentSheet — bottom sheet mock payment Visa
//
// MOCK ONLY — aucune vraie API.
// Pour brancher une vraie API plus tard :
//   → remplacer _processMockPayment() par l'appel réel
//   → garder le reste intact
//
// Utilisation :
//   final paid = await showVisaPaymentSheet(context, total: 75.0);
//   if (paid) { ... continuer réservation ... }
// ══════════════════════════════════════════════════════════

Future<bool> showVisaPaymentSheet(
  BuildContext context, {
  required double total,
  required String parkingName,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true, // s'adapte au clavier
    backgroundColor: Colors.transparent,
    builder: (_) => _VisaPaymentSheet(total: total, parkingName: parkingName),
  );
  return result ?? false;
}

// ══════════════════════════════════════════════════════════
// Widget principal du bottom sheet
// ══════════════════════════════════════════════════════════
class _VisaPaymentSheet extends StatefulWidget {
  final double total;
  final String parkingName;

  const _VisaPaymentSheet({required this.total, required this.parkingName});

  @override
  State<_VisaPaymentSheet> createState() => _VisaPaymentSheetState();
}

// États internes du flow
enum _SheetState { form, processing, success }

class _VisaPaymentSheetState extends State<_VisaPaymentSheet>
    with SingleTickerProviderStateMixin {
  // ── Formulaire ─────────────────────────────────────────
  final _formKey = GlobalKey<FormState>();
  final _cardNumberCtrl = TextEditingController();
  final _expiryCtrl = TextEditingController();
  final _cvvCtrl = TextEditingController();
  final _holderCtrl = TextEditingController();

  // ── État du sheet ──────────────────────────────────────
  _SheetState _state = _SheetState.form;

  // ── Animation check succès ─────────────────────────────
  late final AnimationController _checkAnim = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 600),
  );
  late final Animation<double> _checkScale = CurvedAnimation(
    parent: _checkAnim,
    curve: Curves.elasticOut,
  );

  @override
  void dispose() {
    _cardNumberCtrl.dispose();
    _expiryCtrl.dispose();
    _cvvCtrl.dispose();
    _holderCtrl.dispose();
    _checkAnim.dispose();
    super.dispose();
  }

  // ══════════════════════════════════════════════════════
  // Validation
  // ══════════════════════════════════════════════════════

  String? _validateCardNumber(String? v) {
    if (v == null || v.isEmpty) return 'Numéro requis';
    final digits = v.replaceAll(' ', '');
    if (digits.length < 13 || digits.length > 19) return 'Numéro invalide';
    return null;
  }

  String? _validateExpiry(String? v) {
    if (v == null || v.isEmpty) return 'Date requise';
    final parts = v.split('/');
    if (parts.length != 2) return 'Format MM/YY';
    final month = int.tryParse(parts[0]);
    final year = int.tryParse(parts[1]);
    if (month == null || year == null) return 'Format MM/YY';
    if (month < 1 || month > 12) return 'Mois invalide';
    final now = DateTime.now();
    final expiry = DateTime(2000 + year, month);
    if (expiry.isBefore(DateTime(now.year, now.month))) return 'Carte expirée';
    return null;
  }

  String? _validateCvv(String? v) {
    if (v == null || v.isEmpty) return 'CVV requis';
    if (v.length < 3 || v.length > 4) return 'CVV invalide';
    return null;
  }

  String? _validateHolder(String? v) {
    if (v == null || v.trim().isEmpty) return 'Nom requis';
    if (v.trim().length < 3) return 'Nom trop court';
    return null;
  }

  // ══════════════════════════════════════════════════════
  // Mock processing — remplacer ici pour une vraie API
  // ══════════════════════════════════════════════════════
  Future<void> _processMockPayment() async {
    if (!_formKey.currentState!.validate()) return;

    // Fermer le clavier
    FocusScope.of(context).unfocus();

    setState(() => _state = _SheetState.processing);

    // Simulation délai réseau (2.5 secondes)
    // TODO: remplacer par await RealPaymentApi.charge(...)
    await Future.delayed(const Duration(milliseconds: 2500));

    if (!mounted) return;

    setState(() => _state = _SheetState.success);
    _checkAnim.forward();

    // Fermeture automatique après 2 secondes avec résultat true
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) Navigator.pop(context, true);
  }

  // ══════════════════════════════════════════════════════
  // Build
  // ══════════════════════════════════════════════════════
  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      transitionBuilder: (child, anim) =>
          FadeTransition(opacity: anim, child: child),
      child: switch (_state) {
        _SheetState.form => _buildForm(),
        _SheetState.processing => _buildProcessing(),
        _SheetState.success => _buildSuccess(),
      },
    );
  }

  // ── Formulaire ─────────────────────────────────────────
  Widget _buildForm() {
    return Container(
      key: const ValueKey('form'),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Handle ──────────────────────────────────
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // ── Header ──────────────────────────────────
              Row(
                children: [
                  // Logo Visa simplifié
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A3A6B),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'VISA',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        letterSpacing: 1,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Paiement sécurisé',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A3A6B),
                        ),
                      ),
                      Text(
                        widget.parkingName,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Montant
                  ShaderMask(
                    shaderCallback: (b) =>
                        AppColors.primaryGradient.createShader(b),
                    child: Text(
                      '${widget.total.toInt()} DZD',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),
              const Divider(height: 1),
              const SizedBox(height: 20),

              // ── Card number ─────────────────────────────
              _FieldLabel('Numéro de carte'),
              const SizedBox(height: 6),
              TextFormField(
                controller: _cardNumberCtrl,
                validator: _validateCardNumber,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  _CardNumberFormatter(),
                ],
                maxLength: 19,
                style: _fieldStyle,
                decoration: _fieldDecoration(
                  hint: '0000 0000 0000 0000',
                  icon: Icons.credit_card,
                ),
              ),

              const SizedBox(height: 12),

              // ── Expiry + CVV ────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel('Date expiry'),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _expiryCtrl,
                          validator: _validateExpiry,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            _ExpiryFormatter(),
                          ],
                          maxLength: 5,
                          style: _fieldStyle,
                          decoration: _fieldDecoration(
                            hint: 'MM/YY',
                            icon: Icons.calendar_today_outlined,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel('CVV'),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _cvvCtrl,
                          validator: _validateCvv,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          maxLength: 4,
                          obscureText: true,
                          style: _fieldStyle,
                          decoration: _fieldDecoration(
                            hint: '•••',
                            icon: Icons.lock_outline,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // ── Card holder ─────────────────────────────
              _FieldLabel('Nom du titulaire'),
              const SizedBox(height: 6),
              TextFormField(
                controller: _holderCtrl,
                validator: _validateHolder,
                textCapitalization: TextCapitalization.characters,
                style: _fieldStyle,
                decoration: _fieldDecoration(
                  hint: 'NOM PRÉNOM',
                  icon: Icons.person_outline,
                ),
              ),

              const SizedBox(height: 24),

              // ── Bouton Pay ──────────────────────────────
              SizedBox(
                width: double.infinity,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1A3A6B), Color(0xFF2B5BA8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1A3A6B).withOpacity(0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: _processMockPayment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.lock, color: Colors.white, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'Payer ${widget.total.toInt()} DZD',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Note mock
              const Center(
                child: Text(
                  '🔒 Paiement simulé — aucune donnée transmise',
                  style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Processing ─────────────────────────────────────────
  Widget _buildProcessing() {
    return Container(
      key: const ValueKey('processing'),
      height: 260,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 52,
            height: 52,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(
                const Color(0xFF2B5BA8),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Traitement en cours…',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A3A6B),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Veuillez patienter',
            style: TextStyle(fontSize: 13, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }

  // ── Succès ─────────────────────────────────────────────
  Widget _buildSuccess() {
    return Container(
      key: const ValueKey('success'),
      height: 300,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icône check animée
          ScaleTransition(
            scale: _checkScale,
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF00C853), Color(0xFF69F0AE)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00C853).withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.check_rounded,
                color: Colors.white,
                size: 38,
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Paiement confirmé !',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1A3A6B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${widget.total.toInt()} DZD — ${widget.parkingName}',
            style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
          ),
          const SizedBox(height: 6),
          const Text(
            'Votre place est réservée ✓',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF00C853),
            ),
          ),
        ],
      ),
    );
  }

  // ── Helpers style ───────────────────────────────────────
  static const _fieldStyle = TextStyle(
    fontSize: 14,
    color: Color(0xFF1A3A6B),
    fontWeight: FontWeight.w600,
    letterSpacing: 1,
  );

  InputDecoration _fieldDecoration({
    required String hint,
    required IconData icon,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        color: AppColors.textMuted,
        fontSize: 13,
        fontWeight: FontWeight.w400,
        letterSpacing: 0,
      ),
      prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted),
      filled: true,
      fillColor: const Color(0xFFF7F8FC),
      counterText: '',
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE0E4EF), width: 1.2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF2B5BA8), width: 1.8),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1.2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Colors.red, width: 1.8),
      ),
    );
  }

  Widget _FieldLabel(String text) => Text(
    text,
    style: const TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w600,
      color: AppColors.textMuted,
      letterSpacing: 0.3,
    ),
  );
}

// ══════════════════════════════════════════════════════════
// Formatter numéro de carte : 0000 0000 0000 0000
// ══════════════════════════════════════════════════════════
class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue old,
    TextEditingValue next,
  ) {
    final digits = next.text.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(digits[i]);
    }
    final formatted = buffer.toString();
    return next.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Formatter date expiry : MM/YY
// ══════════════════════════════════════════════════════════
class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue old,
    TextEditingValue next,
  ) {
    final digits = next.text.replaceAll('/', '');
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length && i < 4; i++) {
      if (i == 2) buffer.write('/');
      buffer.write(digits[i]);
    }
    final formatted = buffer.toString();
    return next.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
