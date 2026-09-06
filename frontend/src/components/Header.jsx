import React, { useState, useEffect } from 'react';

const Header = () => {
  // Timer de 150 minutos = 9000 segundos
  const [timeLeft, setTimeLeft] = useState(9000);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-card border-b border-gray-800 p-4 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">TCE-GO Session</h1>
        <div className={`text-xl font-mono ${timeLeft < 1800 ? 'text-red-500' : 'text-primary'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>
    </header>
  );
};

export default Header;
