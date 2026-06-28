import React, { useState, useCallback } from 'react';
import { FiRotateCw, FiSmartphone, FiX } from 'react-icons/fi';

const devices = [
  {
    id: 'iphone16promax',
    name: 'iPhone 16 Pro Max',
    width: 440,
    height: 956,
    borderRadius: 60,
    notchHeight: 44,
    homeBarHeight: 34,
    bezelColor: '#555',
    hasDynamicIsland: true,
    statusBarHeight: 54,
  },
  {
    id: 'iphone16pro',
    name: 'iPhone 16 Pro',
    width: 393,
    height: 852,
    borderRadius: 54,
    notchHeight: 44,
    homeBarHeight: 34,
    bezelColor: '#555',
    hasDynamicIsland: true,
    statusBarHeight: 54,
  },
  {
    id: 'iphonese',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    borderRadius: 16,
    notchHeight: 0,
    homeBarHeight: 0,
    bezelColor: '#444',
    hasDynamicIsland: false,
    statusBarHeight: 20,
  },
  {
    id: 'pixel9pro',
    name: 'Pixel 9 Pro',
    width: 412,
    height: 915,
    borderRadius: 28,
    notchHeight: 40,
    homeBarHeight: 32,
    bezelColor: '#3a3a3a',
    hasDynamicIsland: false,
    hasPunchHole: true,
    statusBarHeight: 40,
  },
  {
    id: 'samsungS25',
    name: 'Samsung Galaxy S25',
    width: 412,
    height: 915,
    borderRadius: 28,
    notchHeight: 0,
    homeBarHeight: 32,
    bezelColor: '#2a2a2a',
    hasDynamicIsland: false,
    hasPunchHole: true,
    statusBarHeight: 30,
  },
  {
    id: 'ipadmini',
    name: 'iPad mini',
    width: 744,
    height: 1133,
    borderRadius: 22,
    notchHeight: 0,
    homeBarHeight: 20,
    bezelColor: '#444',
    hasDynamicIsland: false,
    statusBarHeight: 24,
  },
];

function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth < 600;
}

const PhoneFrame = ({ children }) => {
  const [showFrame, setShowFrame] = useState(!isMobile());
  const [device, setDevice] = useState(devices[0]);
  const [rotated, setRotated] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const w = rotated ? device.height : device.width;
  const h = rotated ? device.width : device.height;

  const handleDeviceChange = useCallback((d) => {
    setDevice(d);
    setShowPicker(false);
  }, []);

  if (!showFrame) return children;

  return (
    <div className="phone-wrapper">
      <div className="phone-device-bar">
        <button className="phone-device-btn" onClick={() => setShowPicker(p => !p)} title="Change device">
          <FiSmartphone size={16} />
          <span>{device.name}</span>
        </button>
        <button className="phone-device-btn" onClick={() => setRotated(r => !r)} title="Rotate">
          <FiRotateCw size={16} />
        </button>
        <button className="phone-device-btn" onClick={() => setShowFrame(false)} title="Exit device mode">
          <FiX size={16} />
        </button>
      </div>

      {showPicker && (
        <div className="phone-device-picker" onClick={() => setShowPicker(false)}>
          <div className="phone-device-picker-inner" onClick={e => e.stopPropagation()}>
            <p className="phone-device-picker-title">Select a device</p>
            {devices.map(d => (
              <button
                key={d.id}
                className={`phone-device-option ${d.id === device.id ? 'active' : ''}`}
                onClick={() => handleDeviceChange(d)}
              >
                <span className="phone-device-option-name">{d.name}</span>
                <span className="phone-device-option-size">{d.width}×{d.height}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="phone-frame"
        style={{
          width: w,
          height: h,
          borderRadius: device.borderRadius,
          borderWidth: device.id === 'iphonese' ? 2 : 3,
        }}
      >
        {/* Bezel / Frame border */}
        <div className="phone-bezel" style={{ borderRadius: device.borderRadius - 2 }}>
          {/* Status bar area */}
          {device.statusBarHeight > 0 && (
            <div className="phone-status-bar" style={{ height: device.notchHeight > 0 ? device.notchHeight + 10 : device.statusBarHeight }}>
              {/* Dynamic Island / Notch */}
              {device.hasDynamicIsland && (
                <div className="phone-dynamic-island" />
              )}
              {device.hasPunchHole && (
                <div className="phone-punch-hole" />
              )}
              <div className="phone-status-time">9:41</div>
              <div className="phone-status-icons">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
              </div>
            </div>
          )}

          {/* Screen content */}
          <div
            className="phone-screen"
            style={{
              paddingTop: device.notchHeight > 0 ? device.notchHeight + 10 : device.statusBarHeight,
            }}
          >
            {children}
          </div>

          {/* Home indicator */}
          {device.homeBarHeight > 0 && (
            <div className="phone-home-bar" style={{ height: device.homeBarHeight }}>
              <div className="phone-home-indicator" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneFrame;
