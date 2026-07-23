import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react";
import API from "../api/axios";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext({
  cartCount: 0,
  incrementCart: () => {},
  decrementCart: () => {},
  refreshCart: () => {}
});

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useContext(AuthContext);

  // Fetch real count from API whenever auth state changes
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }

    try {
      const res = await API.get("/cart");

      const items = Array.isArray(res?.data)
        ? res.data
        : (res?.data?.items ?? []);

      const total = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

      setCartCount(total);
    } catch (err) {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const incrementCart = (qty = 1) => setCartCount(c => c + qty);
  const decrementCart = (qty = 1) => setCartCount(c => Math.max(0, c - qty));

  return (
    <CartContext.Provider
      value={{ cartCount, incrementCart, decrementCart, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
