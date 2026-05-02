import { useEffect, useState } from 'react';

function ScoringEventOverlay({ eventType, triggerKey }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!eventType) {
      setShow(false);
      return;
    }

    setShow(true);
    const timer = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(timer);
  }, [triggerKey, eventType]);

  if (!show || !eventType) return null;

  const eventText = eventType === 'WICKET' ? 'OUT' : eventType;
  const eventColor = {
    FOUR: 'text-orange-300',
    SIX: 'text-amber-200',
    WICKET: 'text-rose-300',
  }[eventType] || 'text-orange-300';

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className={`animate-score-event ${eventColor} text-6xl font-black tracking-tight drop-shadow-lg sm:text-7xl md:text-8xl`}>
        {eventText}
      </div>
    </div>
  );
}

export default ScoringEventOverlay;
