const palettes = {
    Starters: { colors: ['#F7B267', '#E0603A'], icon: 'food-drumstick' },
    'Dim Sum': { colors: ['#F6D6A8', '#D9883E'], icon: 'food-variant' },
    Soups: { colors: ['#F4A261', '#C8553D'], icon: 'bowl-mix' },
    'Noodles & Rice': { colors: ['#F2C14E', '#D9792B'], icon: 'noodles' },
    'Wok Specials': { colors: ['#E76F51', '#9E2A2B'], icon: 'pot-steam' },
    Desserts: { colors: ['#F4B6C2', '#C95D7A'], icon: 'cupcake' },
    Beverages: { colors: ['#9AD1D4', '#3A8D9B'], icon: 'cup' },
};
const fallback = { colors: ['#F3A27A', '#C4452F'], icon: 'silverware-fork-knife' };
export const dishVisual = (category) => (category && palettes[category]) || fallback;
export const ingredientIcon = (category) =>
    ({
        meat: 'food-steak',
        seafood: 'fish',
        vegetables: 'carrot',
        dry_goods: 'sack',
        sauces: 'bottle-tonic-outline',
        dairy: 'cheese',
        beverages: 'cup-water',
        other: 'package-variant',
    })[category ?? 'other'] ?? 'package-variant';
