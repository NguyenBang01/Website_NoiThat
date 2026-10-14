import { useEffect } from 'react';
import { initAuth } from '../../stores/authStore';
import { initCart } from '../../stores/cartStore';

export default function ClientInitializer() {
  useEffect(() => {
    initAuth();
    initCart();
  }, []);

  return null;
}
