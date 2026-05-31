'use client';

import { useEffect, useState } from 'react';

/**
 * Komponen Toast Notification kustom.
 * Mendukung tiga varian: 'success', 'error', 'warning'.
 * Menyesuaikan estetika untuk light theme secara otomatis (default: white background, premium soft borders).
 * Otomatis menghilang setelah `duration` ms.
 */
export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10);
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onClose?.(), 400);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose?.(), 400);
  };

  const config = {
    success: {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      borderColor: 'border-[#10b981]',
      iconColor: 'text-[#10b981]',
      bgGlow: 'shadow-[0_10px_30px_rgba(16,185,129,0.08)]',
      label: 'Berhasil',
    },
    error: {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      borderColor: 'border-[#ef4444]',
      iconColor: 'text-[#ef4444]',
      bgGlow: 'shadow-[0_10px_30px_rgba(239,68,68,0.08)]',
      label: 'Gagal',
    },
    warning: {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      ),
      borderColor: 'border-[#f59e0b]',
      iconColor: 'text-[#f59e0b]',
      bgGlow: 'shadow-[0_10px_30px_rgba(245,158,11,0.08)]',
      label: 'Peringatan',
    },
  };

  const { icon, borderColor, iconColor, bgGlow, label } = config[type] ?? config.success;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label={`Notifikasi ${label}`}
      className={`
        fixed top-5 right-5 z-50 flex items-start gap-3 
        min-w-[300px] max-w-[420px] p-4
        bg-white border-l-4 ${borderColor}
        rounded-lg shadow-xl ${bgGlow}
        transition-all duration-400 ease-out border border-slate-100
        ${visible && !exiting
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full'
        }
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${iconColor}`}>
          {label}
        </p>
        <p className="text-xs text-slate-600 font-semibold leading-relaxed break-words">
          {message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        aria-label="Tutup notifikasi"
        className="flex-shrink-0 ml-1 text-slate-400 hover:text-slate-600 transition-colors duration-200 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
