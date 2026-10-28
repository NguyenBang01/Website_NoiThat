import { useEffect } from 'react';
import { initAuth } from '../../stores/authStore';
import { initCart } from '../../stores/cartStore';
import { initWishlist } from '../../stores/wishlistStore';

export default function ClientInitializer() {
  useEffect(() => {
    initAuth();
    initCart();
    initWishlist();
  }, []);

  return null;
}
