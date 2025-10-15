
import './ConfirmModal.css';

function ConfirmModal({ title, message, onConfirm, onCancel, isTerminal, isAdmin, location }) {
  return (
    <div className="modal-overlay">
      <div className="modal">


        {!isTerminal && (
          <div className="warning-note">
            Важно! При оформлении интернет-заказа необходимо правильно выбрать
            ТОРГОВУЮ ТОЧКУ (яркая кнопка вверху).
          </div>
        )}



        <h2>{title || 'Подтверждение'}</h2>
        {/* <p>{message || 'Вы уверены?'}</p> */}
        <div className="modal-buttons">
          <button className="modal-confirm" onClick={onConfirm}>
            Подтвердить
          </button>
          <button className="modal-cancel" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
