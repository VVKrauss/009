import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type PaymentWidgetModalProps = {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string;
};

const PaymentWidgetModal = ({ isOpen, onClose, widgetId }: PaymentWidgetModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && widgetId && containerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://widget.oblakkarte.rs/widget.js';
      script.setAttribute('data-organizer-public-token', widgetId);
      containerRef.current.appendChild(script);

      return () => {
        if (containerRef.current?.contains(script)) {
          containerRef.current.removeChild(script);
        }
      };
    }
  }, [isOpen, widgetId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg w-full max-w-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Оплата билета</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div ref={containerRef} className="p-6" />
      </div>
    </div>
  );
};

export default PaymentWidgetModal;