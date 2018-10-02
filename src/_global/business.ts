const VARIANT_PRICE_UPPER_RATE = 1;
const VARIANT_PRICE_LOWER_RATE = -0.5;
export function isVariantPriceInRange(basePrice, variantPrice) {
    return (variantPrice <= basePrice * (1 + VARIANT_PRICE_UPPER_RATE) && variantPrice >= basePrice * (1 + VARIANT_PRICE_LOWER_RATE));
}

const REWARD_POINTS_RATE = 0.5;
export function calculateRewardPts(productTotalBeforePromotion, commission) {
    return productTotalBeforePromotion * commission * REWARD_POINTS_RATE * 100;
}
export function calculateDiscountPrice(up, rate) {
    return up * (1 - rate / 100);
}