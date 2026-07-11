/**
 * SpecBoxSection.tsx
 *
 * A self-contained, brand-styled "Material Specification" panel that
 * is injected into print templates when an item type can be detected.
 *
 * Usage (inside any print component):
 *
 *   <SpecBoxSection itemTypeName="MS ANGLE 75×75×6" details={specDetails} />
 *
 * The component:
 *  1. Infers the ItemTypeConfig from `itemTypeName` (or accepts an explicit `itemTypeKey`)
 *  2. Renders only the fields defined for that type
 *  3. Shows "—" for any missing field value
 *  4. Uses inline styles that match the existing navy/orange brand palette —
 *     no new CSS classes are introduced; safe to embed in any print template.
 */

import React from 'react';
import {
  inferItemTypeFromName,
  getItemTypeConfigByKey,
  type ItemTypeConfig,
  type SpecDetails,
} from '../config/itemTypeConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Brand tokens (must match existing navy/orange palette)
// ─────────────────────────────────────────────────────────────────────────────
const NAVY   = '#16245f';
const ORANGE = '#f1721c';
const LIGHT  = '#fde6d3';   // pale orange tint — matches existing hash-bar bg
const RULE   = '#e5e9f7';   // subtle navy-tinted divider

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function resolveConfig(
  itemTypeName?: string,
  itemTypeKey?: string,
): ItemTypeConfig | undefined {
  if (itemTypeKey) {
    const byKey = getItemTypeConfigByKey(itemTypeKey);
    if (byKey) return byKey;
  }
  if (itemTypeName) return inferItemTypeFromName(itemTypeName);
  return undefined;
}

function formatValue(raw: string | number | undefined, unit?: string): string {
  if (raw === undefined || raw === null || raw === '' || raw === 0) return '—';
  const str = String(raw).trim();
  if (!str || str === '0') return '—';
  return unit ? `${str} ${unit}` : str;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface SpecBoxSectionProps {
  /**
   * Raw item name from the form (e.g. "MS ANGLE 75×75×6").
   * Used for auto-detection when `itemTypeKey` is not provided.
   */
  itemTypeName?: string;

  /**
   * Explicit item type key (e.g. "MS_PLATE").
   * Takes precedence over `itemTypeName` for config lookup.
   */
  itemTypeKey?: string;

  /**
   * The actual field values entered by the user.
   * Keys correspond to `ItemTypeField.key` in the config.
   */
  details: SpecDetails;

  /**
   * Optional override for the section heading.
   * Defaults to the config's `boxLabel`.
   */
  customLabel?: string;

  /**
   * If true, renders nothing (useful when the parent wants to conditionally
   * suppress the spec box without complex guard logic at the call site).
   */
  hidden?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const SpecBoxSection: React.FC<SpecBoxSectionProps> = ({
  itemTypeName,
  itemTypeKey,
  details,
  customLabel,
  hidden = false,
}) => {
  if (hidden) return null;

  const config = resolveConfig(itemTypeName, itemTypeKey);
  if (!config) return null;

  const heading = customLabel || config.boxLabel;

  return (
    <div
      className="spec-box-section"
      style={{
        margin: '8px 0',
        border: `1.5px solid ${NAVY}`,
        borderRadius: '6px',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* ── Heading bar ── */}
      <div
        style={{
          background: NAVY,
          padding: '5px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Orange accent diamond */}
        <span
          style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            background: ORANGE,
            transform: 'rotate(45deg)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: '#fff',
            fontSize: '7.5pt',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {heading}
        </span>
      </div>

      {/* ── Field grid ── */}
      <div
        style={{
          background: '#fff',
          padding: '6px 10px 8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0',
        }}
      >
        {config.fields.map((field, idx) => {
          const raw = details[field.key];
          const value = formatValue(raw, field.unit);
          const isLast = idx === config.fields.length - 1;

          return (
            <div
              key={field.key}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '4px',
                minWidth: '160px',
                flex: '1 1 160px',
                paddingRight: '10px',
                paddingTop: '5px',
                paddingBottom: '5px',
                borderRight: !isLast ? `1px solid ${RULE}` : 'none',
                marginRight: !isLast ? '10px' : '0',
              }}
            >
              {/* Label pill */}
              <span
                style={{
                  display: 'inline-block',
                  background: LIGHT,
                  color: NAVY,
                  fontSize: '6.5pt',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {field.label}
              </span>

              {/* Colon */}
              <span
                style={{
                  color: NAVY,
                  fontWeight: 600,
                  fontSize: '7pt',
                  flexShrink: 0,
                }}
              >
                :
              </span>

              {/* Value */}
              <span
                style={{
                  color: value === '—' ? '#999' : NAVY,
                  fontWeight: value === '—' ? 400 : 700,
                  fontSize: '7.5pt',
                  whiteSpace: 'nowrap',
                }}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Bottom accent line ── */}
      <div
        style={{
          height: '3px',
          background: `linear-gradient(90deg, ${ORANGE} 0%, ${NAVY} 100%)`,
        }}
      />
    </div>
  );
};
