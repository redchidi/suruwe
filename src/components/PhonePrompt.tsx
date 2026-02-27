'use client';

import { useState } from 'react';

interface PhonePromptProps {
  onSubmit: (phone: string) => void;
  onSkip: () => void;
}

export default function PhonePrompt({ onSubmit, onSkip }: PhonePromptProps) {
  const [phone, setPhone] = useState('');

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onSkip()}>
      <div className="modal">
        <h3>Add your phone number</h3>
        <p>
          So you can always access your Suruwe profile from any device.
          We will send you a link via WhatsApp.
        </p>
        <div className="input-group">
          <input
            type="tel"
            className="input"
            placeholder="+234 XXX XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-primary btn-full"
            onClick={() => phone.trim() && onSubmit(phone.trim())}
            disabled={!phone.trim()}
          >
            Save
          </button>
          <button className="btn btn-ghost btn-full" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
