
import React, { useRef } from 'react';

interface BankModalProps {
  isOpen: boolean;
  bank: number;
  onClose: () => void;
  onUpdateBank: (newBank: number) => void;
}

const BankModal: React.FC<BankModalProps> = ({ isOpen, bank, onClose, onUpdateBank }) => {
  const bankInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (bankInputRef.current) {
      const val = parseFloat(bankInputRef.current.value);
      if (!isNaN(val)) onUpdateBank(Math.round(val * 10));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-center">Adjust Budget</h3>
        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 mb-4 focus-within:border-green-500/50 transition-colors">
          <span className="text-green-500 font-black text-lg">€</span>
          <input 
            ref={bankInputRef}
            type="number" 
            step="0.1"
            autoFocus
            className="bg-transparent text-white font-black text-xl outline-none w-full"
            defaultValue={(bank / 10).toFixed(1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
          />
          <span className="text-white/60 font-black text-sm uppercase">M</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase text-white/50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-slate-950 rounded-xl text-xs font-black uppercase transition-colors">Update</button>
        </div>
      </div>
    </div>
  );
};

export default BankModal;
