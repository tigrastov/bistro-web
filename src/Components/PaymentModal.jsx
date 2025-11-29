import React from 'react';
import PaymentHandler from './PaymentHandler';
import './PaymentHandler.css';

export default function PaymentModal({ order, isDelivery, cartPrice, totalPrice, deliveryPrice, clearCart, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <PaymentHandler
          order={order}
          isDelivery={isDelivery}
          cartPrice={cartPrice}
          totalPrice={totalPrice}
          deliveryPrice={deliveryPrice}
          clearCart={clearCart}
          onPaymentSuccess={onClose}
          onPaymentError={onClose}
        />
      </div>
    </div>
  );
}
