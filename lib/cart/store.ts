import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, Product, ProductVariant } from '../local/types';

interface CartState {
  cart: Cart;
  addItem: (product: Product, variant: ProductVariant) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
}

const createEmptyCart = (): Cart => ({
  id: 'local-cart',
  checkoutUrl: '',
  cost: {
    subtotalAmount: { amount: '0', currencyCode: 'VND' },
    totalAmount: { amount: '0', currencyCode: 'VND' },
   
  },
  lines: [],
  totalQuantity: 0
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: createEmptyCart(),

      addItem: (product, variant) => {
        const { cart } = get();
        const existingLineIndex = cart.lines.findIndex(
          (line) => line.merchandise.id === variant.id
        );

        let newLines = [...cart.lines];

        if (existingLineIndex > -1) {
          const existingLine = newLines[existingLineIndex]!;
          newLines[existingLineIndex] = {
            ...existingLine,
            quantity: existingLine.quantity + 1,
            cost: {
              totalAmount: {
                amount: (
                  parseFloat(existingLine.cost.totalAmount.amount) + 
                  parseFloat(variant.price.amount)
                ).toString(),
                currencyCode: 'VND'
              }
            }
          };
        } else {
          const newLine: CartItem = {
            id: `line-${Date.now()}`,
            quantity: 1,
            cost: {
              totalAmount: variant.price
            },
            merchandise: {
              id: variant.id,
              title: variant.title,
              selectedOptions: variant.selectedOptions,
              product: {
                id: product.id,
                handle: product.handle,
                title: product.title,
                featuredImage: product.featuredImage
              }
            }
          };
          newLines.push(newLine);
        }

        const totalQuantity = newLines.reduce((acc, line) => acc + line.quantity, 0);
        const totalAmount = newLines.reduce(
          (acc, line) => acc + parseFloat(line.cost.totalAmount.amount), 
          0
        ).toString();

        set({
          cart: {
            ...cart,
            lines: newLines,
            totalQuantity,
            cost: {
              ...cart.cost,
              subtotalAmount: { amount: totalAmount, currencyCode: 'VND' },
              totalAmount: { amount: totalAmount, currencyCode: 'VND' }
            }
          }
        });
      },

      removeItem: (lineId) => {
        const { cart } = get();
        const newLines = cart.lines.filter((line) => line.id !== lineId);
        
        const totalQuantity = newLines.reduce((acc, line) => acc + line.quantity, 0);
        const totalAmount = newLines.reduce(
          (acc, line) => acc + parseFloat(line.cost.totalAmount.amount), 
          0
        ).toString();

        set({
          cart: {
            ...cart,
            lines: newLines,
            totalQuantity,
            cost: {
              ...cart.cost,
              subtotalAmount: { amount: totalAmount, currencyCode: 'VND' },
              totalAmount: { amount: totalAmount, currencyCode: 'VND' }
            }
          }
        });
      },

      updateQuantity: (lineId, quantity) => {
        const { cart } = get();
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }

        const newLines = cart.lines.map((line) => {
          if (line.id === lineId) {
            const unitPrice = parseFloat(line.cost.totalAmount.amount) / line.quantity;
            return {
              ...line,
              quantity,
              cost: {
                totalAmount: {
                  amount: (unitPrice * quantity).toString(),
                  currencyCode: 'VND'
                }
              }
            };
          }
          return line;
        });

        const totalQuantity = newLines.reduce((acc, line) => acc + line.quantity, 0);
        const totalAmount = newLines.reduce(
          (acc, line) => acc + parseFloat(line.cost.totalAmount.amount), 
          0
        ).toString();

        set({
          cart: {
            ...cart,
            lines: newLines,
            totalQuantity,
            cost: {
              ...cart.cost,
              subtotalAmount: { amount: totalAmount, currencyCode: 'VND' },
              totalAmount: { amount: totalAmount, currencyCode: 'VND' }
            }
          }
        });
      },

      clearCart: () => set({ cart: createEmptyCart() })
    }),
    {
      name: 'fishing-cart-storage'
    }
  )
);
