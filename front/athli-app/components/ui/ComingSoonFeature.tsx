// components/ui/ComingSoonFeature.tsx
//
// Section "Ce qui arrive bientôt" — UI uniquement, aucune logique active.
// Pour activer un item : retirer `disabled` sur son TouchableOpacity et
// brancher l'onPress correspondant.

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import spacing from '../../constants/spacing';

// ---------------------------------------------------------------------------
// Types publics
// ---------------------------------------------------------------------------

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

export interface ComingSoonItem {
  /** Clé unique pour le rendu de liste. */
  id: string;
  /** Icône MaterialIcons affichée à gauche. */
  icon: MaterialIconName;
  /** Couleur de l'icône. Défaut : amber #F59E0B. */
  iconColor?: string;
  /** Fond de la boîte icône. Défaut : amber 10 % opacité. */
  iconBgColor?: string;
  /** Titre principal de la fonctionnalité. */
  title: string;
  /** Sous-titre optionnel (description courte). */
  subtitle?: string;
  /** Texte du badge. Défaut : "En développement". */
  badgeText?: string;
}

interface ComingSoonFeatureProps {
  /** Liste des fonctionnalités à afficher. */
  items: ComingSoonItem[];
  /** Titre de la section. Défaut : "🚀 Ce qui arrive bientôt". */
  sectionTitle?: string;
  /** Style optionnel appliqué au conteneur de section. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Badge "En développement"
// ---------------------------------------------------------------------------

interface BadgeProps {
  label: string;
}

function ComingSoonBadge({ label }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <View style={styles.badgeDot} />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ligne individuelle (feature row)
// ---------------------------------------------------------------------------

interface RowProps {
  item: ComingSoonItem;
}

function ComingSoonRow({ item }: RowProps) {
  const iconColor  = item.iconColor  ?? '#F59E0B';
  const iconBgColor = item.iconBgColor ?? 'rgba(245, 158, 11, 0.1)';
  const badgeLabel  = item.badgeText  ?? 'En développement';

  return (
    /*
     * disabled={true} : l'utilisateur ne peut pas interagir avec la row.
     * Pour activer : supprimer `disabled` et décommenter l'onPress.
     */
    <TouchableOpacity
      style={[styles.row, styles.rowDisabled]}
      activeOpacity={0.7}
      disabled={true}
      // onPress={() => { /* TODO : navigation ou action */ }}
    >
      {/* Icône + textes */}
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          <MaterialIcons name={item.icon} size={20} color={iconColor} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
          ) : null}
        </View>
      </View>

      {/* Badge statut */}
      <ComingSoonBadge label={badgeLabel} />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Export principal — Section complète
// ---------------------------------------------------------------------------

export default function ComingSoonFeature({
  items,
  sectionTitle,
  style,
}: ComingSoonFeatureProps) {
  if (!items.length) return null;

  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>
        {sectionTitle ?? '🚀 Ce qui arrive bientôt'}
      </Text>

      {items.map((item) => (
        <ComingSoonRow key={item.id} item={item} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const AMBER        = '#F59E0B';
const AMBER_LIGHT  = 'rgba(245, 158, 11, 0.12)';
const TEXT_PRIMARY = '#0F172A';
const TEXT_MUTED   = '#64748B';

const styles = StyleSheet.create({
  // Section
  section: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: AMBER,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  // Légère opacité pour signaler visuellement que l'item est inactif.
  rowDisabled: {
    opacity: 0.6,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },

  // Icône
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Textes
  textBlock: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginTop: 2,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AMBER_LIGHT,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: spacing.sm,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AMBER,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: AMBER,
    letterSpacing: 0.2,
  },
});
