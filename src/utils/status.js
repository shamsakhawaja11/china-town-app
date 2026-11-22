import { colors } from '../theme';
const tone = (label, fg, bg, icon) => ({ label, fg, bg, icon });
export const orderStatus = {
    draft: tone('In cart', colors.textMuted, colors.surfaceAlt, 'cart-outline'),
    pending: tone('Awaiting approval', colors.warning, colors.warningSoft, 'timer-sand'),
    accepted: tone('Accepted', colors.info, colors.infoSoft, 'check-circle-outline'),
    preparing: tone('Preparing', colors.gold, colors.goldSoft, 'chef-hat'),
    ready: tone('Ready', colors.success, colors.successSoft, 'bell-ring-outline'),
    served: tone('Served', colors.success, colors.successSoft, 'silverware-fork-knife'),
    completed: tone('Completed', colors.textMuted, colors.surfaceAlt, 'check-all'),
    rejected: tone('Rejected', colors.danger, colors.dangerSoft, 'close-circle-outline'),
    cancelled: tone('Cancelled', colors.danger, colors.dangerSoft, 'cancel'),
};
export const paymentStatus = {
    unpaid: tone('Unpaid', colors.warning, colors.warningSoft, 'cash-clock'),
    paid: tone('Paid', colors.success, colors.successSoft, 'check-decagram'),
    refunded: tone('Refunded', colors.info, colors.infoSoft, 'cash-refund'),
    partially_refunded: tone('Part refunded', colors.info, colors.infoSoft, 'cash-refund'),
};
export const reservationStatus = {
    pending: tone('Pending', colors.warning, colors.warningSoft, 'timer-sand'),
    confirmed: tone('Confirmed', colors.success, colors.successSoft, 'calendar-check'),
    seated: tone('Seated', colors.info, colors.infoSoft, 'seat'),
    completed: tone('Completed', colors.textMuted, colors.surfaceAlt, 'check-all'),
    cancelled: tone('Cancelled', colors.danger, colors.dangerSoft, 'calendar-remove'),
    no_show: tone('No-show', colors.danger, colors.dangerSoft, 'account-off-outline'),
};
export const stockStatus = {
    ok: tone('In stock', colors.success, colors.successSoft, 'check-circle'),
    low: tone('Low stock', colors.warning, colors.warningSoft, 'alert'),
    out_of_stock: tone('Out of stock', colors.danger, colors.dangerSoft, 'alert-octagon'),
};
export const kitchenStatus = {
    unassigned: tone('Unassigned', colors.textMuted, colors.surfaceAlt, 'account-question-outline'),
    assigned: tone('Queued', colors.info, colors.infoSoft, 'clipboard-text-clock-outline'),
    in_progress: tone('Cooking', colors.gold, colors.goldSoft, 'fire'),
    done: tone('Done', colors.success, colors.successSoft, 'check'),
};
export const poStatus = {
    ordered: tone('Ordered', colors.info, colors.infoSoft, 'truck-outline'),
    partially_received: tone('Partly received', colors.warning, colors.warningSoft, 'truck-check-outline'),
    received: tone('Received', colors.success, colors.successSoft, 'package-variant-closed-check'),
    cancelled: tone('Cancelled', colors.danger, colors.dangerSoft, 'cancel'),
};
export const spiceLabel = {
    none: 'Not spicy',
    mild: 'Mild',
    medium: 'Medium',
    hot: 'Hot',
    extra_hot: 'Extra hot',
};
export const spiceLevel = { none: 0, mild: 1, medium: 2, hot: 3, extra_hot: 4 };
