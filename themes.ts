
export interface ThemeColors {
  primaryBg: string;
  accentGreen: string;
  accentGrey: string;
  accentRed: string;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
  inputBg: string;
  textOnAccent: string;
  borderColor: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export const themes: Record<string, Theme> = {
  balancedLedger: {
    name: 'Balanced Ledger',
    colors: {
      primaryBg: '#F5F5DC',        // Audit Trail Beige
      accentGreen: '#2ECC71',      // Compliant Green
      accentGrey: '#7F8C8D',       // Due Diligence Grey
      accentRed: '#E74C3C',        // Fiscal Scrutiny Red
      textPrimary: '#34495E',      // Legible Document Ink (Dark)
      textSecondary: '#95A5A6',    // Legible Document Ink (Light)
      cardBg: '#FFFFFF',           // Pure white for cards on beige
      inputBg: '#F5F5DC',          // Inputs on cards match primary for this theme
      textOnAccent: '#FFFFFF',     // White text on accent-green buttons
      borderColor: '#7F8C8D',      // Due Diligence Grey is also for borders
    }
  },
  oledDark: {
    name: 'OLED Dark',
    colors: {
      primaryBg: '#000000',        // Pure Black
      accentGreen: '#34D399',      // Vibrant Green (tailwind green-400)
      accentGrey: '#4B5563',       // Medium-Dark Grey (tailwind gray-600)
      accentRed: '#F87171',        // Vibrant Red (tailwind red-400)
      textPrimary: '#E5E7EB',      // Light Grey (tailwind gray-200)
      textSecondary: '#9CA3AF',    // Medium Grey (tailwind gray-400)
      cardBg: '#111827',           // Very Dark Blue/Grey (tailwind gray-900)
      inputBg: '#1F2937',          // Dark Grey (tailwind gray-800)
      textOnAccent: '#FFFFFF',     // White text on accent-green
      borderColor: '#374151',      // Darker border (tailwind gray-700)
    }
  },
  whale: {
    name: 'Whale',
    colors: {
      primaryBg: '#2C3E50',        // Abyssal Slate
      accentGreen: '#F1C40F',      // Sunken Gold (mapped to accentGreen role)
      accentGrey: '#5B7B7B',       // Seaweed Green-Brown (mapped to accentGrey role)
      accentRed: '#D35400',        // Crustacean Red-Orange (mapped to accentRed role)
      textPrimary: '#ECF0F1',      // Phosphorescent Glow (Light)
      textSecondary: '#BDC3C7',    // Phosphorescent Glow (Mid-light)
      cardBg: '#34495E',           // Using "Legible Document Ink" as a dark card background
      inputBg: '#34495E',          // Same as cardBg for consistency
      textOnAccent: '#2C3E50',     // Dark text (Abyssal Slate) for the gold accent
      borderColor: '#5B7B7B',      // Seaweed Green-Brown is also for borders
    }
  }
};
