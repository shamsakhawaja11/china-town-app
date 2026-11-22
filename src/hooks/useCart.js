import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { haptics } from '../lib/haptics';
import { cartApi } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { toast } from '../store/toast';
import { useAuth } from '../store/auth';
export const CART_KEY = ['cart'];
export function useCart() {
    const qc = useQueryClient();
    const signedIn = useAuth((s) => s.user?.role === 'customer');
    const query = useQuery({ queryKey: CART_KEY, queryFn: cartApi.get, enabled: signedIn });
    const onCart = (cart) => qc.setQueryData(CART_KEY, cart);
    const onError = (e) => toast.error("Couldn't update cart", errorMessage(e));
    const add = useMutation({
        mutationFn: (v) => cartApi.add(v.menuItemId, v.quantity, v.specialInstructions, v.orderType),
        onSuccess: (cart, v) => {
            onCart(cart);
            haptics.success();
            if (v.name) toast.success('Added to cart', `${v.quantity} × ${v.name}`);
        },
        onError,
    });
    const setQty = useMutation({
        mutationFn: (v) => cartApi.updateLine(v.lineId, { quantity: v.quantity }),
        onSuccess: onCart,
        onError,
    });
    const setNote = useMutation({
        mutationFn: (v) => cartApi.updateLine(v.lineId, { specialInstructions: v.note }),
        onSuccess: onCart,
        onError,
    });
    const remove = useMutation({ mutationFn: (lineId) => cartApi.removeLine(lineId), onSuccess: onCart, onError });
    const clear = useMutation({ mutationFn: cartApi.clear, onSuccess: onCart, onError });
    const update = useMutation({ mutationFn: cartApi.update, onSuccess: onCart, onError });
    const cart = query.data;
    const qtyOf = (menuItemId) => cart?.items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0;
    const lineOf = (menuItemId) => cart?.items.find((i) => i.menuItemId === menuItemId);
    return { query, cart, add, setQty, setNote, remove, clear, update, qtyOf, lineOf };
}
