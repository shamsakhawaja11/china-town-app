import { http } from './client';
const get = (url, params) => http.get(url, { params }).then((r) => r.data);
const post = (url, body) => http.post(url, body ?? {}).then((r) => r.data);
const patch = (url, body) => http.patch(url, body ?? {}).then((r) => r.data);
const put = (url, body) => http.put(url, body ?? {}).then((r) => r.data);
const del = (url) => http.delete(url).then((r) => r.data);
const list = (xs) => (xs && xs.length ? xs.join(',') : undefined);
export const authApi = {
    login: (contact, password) => post('/auth/login', { contact, password, deviceInfo: 'Chinatown app' }),
    register: (body) => post('/auth/register', body),
    me: () => get('/auth/me'),
    logout: (refreshToken) => post('/auth/logout', { refreshToken }),
    changePassword: (currentPassword, newPassword) => post('/auth/change-password', { currentPassword, newPassword }),
};
export const restaurantApi = {
    get: () => get('/restaurant'),
    liveTables: () => get('/restaurant/tables'),
    update: (body) => patch('/admin/restaurant', body),
};
export const menuApi = {
    categories: () => get('/menu/categories'),
    items: (params) => get('/menu/items', { ...params, excludeAllergenIds: list(params.excludeAllergenIds) }),
    item: (id) => get(`/menu/items/${id}`),
    allergens: () => get('/menu/allergens'),
    adminItems: () => get('/admin/menu/items'),
    updateItem: (id, body) => patch(`/admin/menu/items/${id}`, body),
    uploadImage: async (uri, type, fileName) => {
        const name = fileName ?? uri.split('/').pop() ?? 'photo.jpg';
        const ext = name.split('.').pop()?.toLowerCase();
        const mime = type ?? (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
        const form = new FormData();
        form.append('file', { uri, name, type: mime });
        const { data } = await http.post('/admin/uploads/image', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.path;
    },
};
export const reviewsApi = {
    restaurant: (params) => get('/reviews/restaurant', params),
    dish: (menuItemId, params = {}) => get(`/menu/items/${menuItemId}/reviews`, params),
    rateRestaurant: (orderId, body) => post(`/orders/${orderId}/review`, body),
    rateDishes: (orderId, reviews) => post(`/orders/${orderId}/dish-reviews`, { reviews }),
    mine: () => get('/reviews/me'),
    pending: () => get('/reviews/pending'),
    adminSummary: () => get('/admin/reviews/summary'),
    adminRestaurant: (params) => get('/admin/reviews/restaurant', params),
    adminDishes: (params) => get('/admin/reviews/dishes', params),
};
export const cartApi = {
    get: () => get('/cart'),
    update: (body) => patch('/cart', body),
    clear: () => del('/cart'),
    add: (menuItemId, quantity, specialInstructions, orderType) =>
        post('/cart/items', { menuItemId, quantity, specialInstructions: specialInstructions || undefined, orderType }),
    updateLine: (id, body) => patch(`/cart/items/${id}`, body),
    removeLine: (id) => del(`/cart/items/${id}`),
    checkout: (body) => post('/cart/checkout', body),
};
export const ordersApi = {
    mine: (scope, page = 1) => get('/orders/me', { scope, page, limit: 20 }),
    get: (id) => get(`/orders/${id}`),
    cancel: (id, reason) => post(`/orders/${id}/cancel`, { reason }),
    bill: (id) => get(`/orders/${id}/bill`),
    pay: (id, body) => post(`/orders/${id}/pay`, body),
    confirmCard: (paymentId, body) => post(`/payments/${paymentId}/confirm-card`, body),
    payments: () => get('/payments/me'),
};
export const walletApi = {
    get: () => get('/wallet'),
    transactions: (page = 1) => get('/wallet/transactions', { page, limit: 30 }),
    topUp: (amount, cardLast4, idempotencyKey) => post('/wallet/top-up', { amount, cardLast4, idempotencyKey }),
};
export const reservationsApi = {
    availability: (reservationTime, partySize, durationMinutes = 90) =>
        get('/reservations/availability', { reservationTime, partySize, durationMinutes }),
    create: (body) => post('/reservations', body),
    mine: (scope) => get('/reservations/me', { scope, limit: 50 }),
    get: (id) => get(`/reservations/${id}`),
    cancel: (id, reason) => post(`/reservations/${id}/cancel`, { reason }),
    payDeposit: (id, method, cardLast4) => post(`/reservations/${id}/deposit`, { method, cardLast4 }),
    adminList: (params) => get('/admin/reservations', { ...params, status: list(params.status), limit: 100 }),
    adminGet: (id) => get(`/admin/reservations/${id}`),
    setStatus: (id, status, reason) => patch(`/admin/reservations/${id}/status`, { status, reason }),
};
export const notificationsApi = {
    list: (page = 1) => get('/notifications', { page, limit: 30 }),
    unread: () => get('/notifications/unread-count'),
    read: (id) => patch(`/notifications/${id}/read`),
    readAll: () => patch('/notifications/read-all'),
};
export const usersApi = {
    profile: () => get('/users/me/profile'),
    update: (body) => patch('/users/me', body),
};
export const adminApi = {
    dashboard: () => get('/admin/dashboard'),
    orders: (params) => get('/admin/orders', { ...params, status: list(params.status), limit: params.limit ?? 30 }),
    order: (id) => get(`/admin/orders/${id}`),
    accept: (id) => post(`/admin/orders/${id}/accept`),
    reject: (id, reason) => post(`/admin/orders/${id}/reject`, { reason }),
    serve: (id) => post(`/admin/orders/${id}/serve`),
    pickup: (id, pickupCode) => post(`/admin/orders/${id}/pickup`, { pickupCode }),
    complete: (id) => post(`/admin/orders/${id}/complete`),
    cancel: (id, reason) => post(`/admin/orders/${id}/cancel`, { reason }),
    bill: (id) => get(`/admin/orders/${id}/bill`),
    recordCash: (id, tip) => post(`/admin/orders/${id}/cash-payment`, { tip }),
    confirmCash: (paymentId) => post(`/admin/payments/${paymentId}/confirm-cash`),
    refund: (paymentId, body) => post(`/admin/payments/${paymentId}/refunds`, body),
    chefs: () => get('/admin/chefs'),
    suggestions: (orderId) => get(`/admin/orders/${orderId}/chef-suggestions`),
    assign: (orderId, assignments, replace = true) => post(`/admin/orders/${orderId}/assignments`, { assignments, replace }),
    autoAssign: (orderId) => post(`/admin/orders/${orderId}/auto-assign`),
    board: () => get('/kitchen/board'),
    myTasks: () => get('/kitchen/my-tasks'),
    startTask: (id) => post(`/kitchen/assignments/${id}/start`),
    doneTask: (id) => post(`/kitchen/assignments/${id}/done`),
    setAvailability: (isAvailable) => patch('/kitchen/availability', { isAvailable }),
    staff: () => get('/admin/staff'),
    createStaff: (body) => post('/admin/staff/new', body),
    updateStaff: (id, body) => patch(`/admin/staff/${id}`, body),
    setStaffSpecializations: (id, specializationIds) => put(`/admin/staff/${id}/specializations`, { specializationIds }),
    specializations: () => get('/admin/specializations'),
    ingredients: () => get('/admin/ingredients'),
};
export const inventoryApi = {
    list: (params) => get('/admin/inventory', params),
    get: (id) => get(`/admin/inventory/${id}`),
    usage: (id, days = 14) => get(`/admin/inventory/${id}/usage`, { days, forecastDays: 7 }),
    create: (body) => post('/admin/inventory', body),
    update: (id, body) => patch(`/admin/inventory/${id}`, body),
    adjust: (id, body) => post(`/admin/inventory/${id}/stock`, body),
    restockPlan: (coverDays = 7) => get('/admin/inventory/restock-plan', { coverDays }),
    purchaseOrders: (status) => get('/admin/purchase-orders', { status, limit: 50 }),
    purchaseOrder: (id) => get(`/admin/purchase-orders/${id}`),
    createPurchaseOrder: (body) => post('/admin/purchase-orders', body),
    receive: (id, items, notes) => post(`/admin/purchase-orders/${id}/receive`, { items, notes }),
    cancelPurchaseOrder: (id) => post(`/admin/purchase-orders/${id}/cancel`),
};
