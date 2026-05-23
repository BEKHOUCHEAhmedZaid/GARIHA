import 'package:flutter/material.dart';
import '../theme/colors.dart';

// ══════════════════════════════════════════════════════════
// Enums & modèles
// ══════════════════════════════════════════════════════════

enum PaymentMethod { cash, digital }

/// Type de carte digitale — remplace SavedCardOption (trop générique)
/// Chaque type a son propre visuel, couleurs et icône.
enum DigitalPaymentType { visa, baridimob }

extension DigitalPaymentTypeExt on DigitalPaymentType {
  String get label {
    switch (this) {
      case DigitalPaymentType.visa:
        return 'Visa';
      case DigitalPaymentType.baridimob:
        return 'BaridiMob';
    }
  }

  /// Couleur dominante de la carte (gradient start)
  Color get primaryColor {
    switch (this) {
      case DigitalPaymentType.visa:
        return const Color(0xFF1A3A6B);
      case DigitalPaymentType.baridimob:
        return const Color(0xFF007A3D);
    }
  }

  /// Couleur secondaire (gradient end)
  Color get secondaryColor {
    switch (this) {
      case DigitalPaymentType.visa:
        return const Color(0xFF2B5BA8);
      case DigitalPaymentType.baridimob:
        return const Color(0xFFFFC200);
    }
  }

  /// Couleur du texte sur la carte
  Color get textColor => Colors.white;

  /// Icône représentative
  IconData get icon {
    switch (this) {
      case DigitalPaymentType.visa:
        return Icons.credit_card;
      case DigitalPaymentType.baridimob:
        return Icons.account_balance;
    }
  }

  /// Sous-titre affiché sur la carte
  String get subtitle {
    switch (this) {
      case DigitalPaymentType.visa:
        return 'Carte bancaire internationale';
      case DigitalPaymentType.baridimob:
        return 'Paiement mobile Algérie Poste';
    }
  }
}

// ══════════════════════════════════════════════════════════
// SavedCardOption — gardé pour compatibilité avec map_screen.dart
// Wrapper autour de DigitalPaymentType
// ══════════════════════════════════════════════════════════
class SavedCardOption {
  final DigitalPaymentType type;

  const SavedCardOption({required this.type});

  /// Compatibilité avec l'ancien code qui utilise .label et .icon
  String get label => type.label;
  IconData get icon => type.icon;
}

// ══════════════════════════════════════════════════════════
// PaymentMethodToggle — widget principal
// Interface publique INCHANGÉE par rapport à l'original
// ══════════════════════════════════════════════════════════
class PaymentMethodToggle extends StatelessWidget {
  final PaymentMethod selectedMethod;
  final List<SavedCardOption> savedCards;
  final int selectedCardIndex;
  final ValueChanged<PaymentMethod> onMethodChanged;
  final ValueChanged<int> onCardSelected;

  const PaymentMethodToggle({
    super.key,
    required this.selectedMethod,
    required this.savedCards,
    required this.selectedCardIndex,
    required this.onMethodChanged,
    required this.onCardSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Cartes digitales (visibles seulement en mode Digital) ──
        if (selectedMethod == PaymentMethod.digital) ...[
          _DigitalCardSelector(
            cards: savedCards,
            selectedIndex: selectedCardIndex,
            onCardSelected: onCardSelected,
          ),
          const SizedBox(height: 16),
        ],

        // ── Toggle Cash / Digital (inchangé) ──────────────
        Container(
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _ToggleOption(
                label: 'Cash',
                isSelected: selectedMethod == PaymentMethod.cash,
                onTap: () => onMethodChanged(PaymentMethod.cash),
              ),
              _ToggleOption(
                label: 'Digital',
                isSelected: selectedMethod == PaymentMethod.digital,
                onTap: () => onMethodChanged(PaymentMethod.digital),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════
// Toggle option (Cash / Digital) — inchangé visuellement
// ══════════════════════════════════════════════════════════
class _ToggleOption extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToggleOption({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.primaryGradient : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: isSelected ? AppColors.textWhite : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Sélecteur de cartes digitales — redesign premium
// Affiche chaque carte avec son propre style visuel
// ══════════════════════════════════════════════════════════
class _DigitalCardSelector extends StatelessWidget {
  final List<SavedCardOption> cards;
  final int selectedIndex;
  final ValueChanged<int> onCardSelected;

  const _DigitalCardSelector({
    required this.cards,
    required this.selectedIndex,
    required this.onCardSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [

        // Cartes côte à côte
        Row(
          children: List.generate(cards.length, (index) {
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: index < cards.length - 1 ? 10 : 0,
                ),
                child: _PaymentCard(
                  option: cards[index],
                  isSelected: index == selectedIndex,
                  onTap: () => onCardSelected(index),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════
// Carte de paiement individuelle — style premium
// Visa : bleu élégant avec logo chip
// BaridiMob : vert/or avec identité Algérie Poste
// ══════════════════════════════════════════════════════════
class _PaymentCard extends StatelessWidget {
  final SavedCardOption option;
  final bool isSelected;
  final VoidCallback onTap;

  const _PaymentCard({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final type = option.type;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        height: 75,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [type.primaryColor, type.secondaryColor],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? Colors.white : Colors.transparent,
            width: 2.5,
          ),
          boxShadow: [
            BoxShadow(
              color: type.primaryColor.withOpacity(isSelected ? 0.45 : 0.18),
              blurRadius: isSelected ? 16 : 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            // ── Cercles décoratifs fond ──────────────────
            Positioned(
              right: -14,
              top: -14,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.08),
                ),
              ),
            ),
            Positioned(
              right: 10,
              bottom: -20,
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.06),
                ),
              ),
            ),

            // ── Contenu ──────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Ligne du haut : icône + check si sélectionné
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Chip simulé (Visa) ou icône (BaridiMob)
                      _CardTopIcon(type: type),

                      // Indicateur sélection
                      AnimatedOpacity(
                        duration: const Duration(milliseconds: 200),
                        opacity: isSelected ? 1.0 : 0.0,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.check,
                            size: 13,
                            color: type.primaryColor,
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Ligne du bas : nom + sous-titre
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        type.label,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Text(
                        type.subtitle,
                        style: TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w400,
                          color: Colors.white.withOpacity(0.75),
                          letterSpacing: 0.2,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
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
// Icône haut de carte — chip pour Visa, logo pour BaridiMob
// ══════════════════════════════════════════════════════════
class _CardTopIcon extends StatelessWidget {
  final DigitalPaymentType type;

  const _CardTopIcon({required this.type});

  @override
  Widget build(BuildContext context) {
    if (type == DigitalPaymentType.visa) {
      // Chip simulé style carte bancaire
      return Container(
        width: 28,
        height: 20,
        decoration: BoxDecoration(
          color: const Color(0xFFD4A843),
          borderRadius: BorderRadius.circular(4),
        ),
        child: CustomPaint(painter: _ChipPainter()),
      );
    }

    // BaridiMob — icône rond coloré
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.account_balance, size: 16, color: Colors.white),
    );
  }
}

// ══════════════════════════════════════════════════════════
// Peintre du chip de carte bancaire (lignes dorées)
// ══════════════════════════════════════════════════════════
class _ChipPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFB8922A)
      ..strokeWidth = 0.8
      ..style = PaintingStyle.stroke;

    // Ligne verticale centrale
    canvas.drawLine(
      Offset(size.width / 2, 2),
      Offset(size.width / 2, size.height - 2),
      paint,
    );
    // Ligne horizontale centrale
    canvas.drawLine(
      Offset(2, size.height / 2),
      Offset(size.width - 2, size.height / 2),
      paint,
    );
  }

  @override
  bool shouldRepaint(_) => false;
}
