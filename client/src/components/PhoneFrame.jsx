import React from 'react';

function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 600;
}

const PhoneFrame = ({ children }) => {
  const [showFrame, setShowFrame] = React.useState(!isMobile());

  React.useEffect(() => {
    const check = () => setShowFrame(!isMobile());
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!showFrame) return children;

  return (
    <div className="phone-wrapper">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          {children}
        </div>
        <div className="phone-home" />
      </div>
    </div>
  );
};

export default PhoneFrame;
