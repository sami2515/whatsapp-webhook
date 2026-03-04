import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
    return (
        <div className="splash-screen">
            <div className="splash-content">
                <img
                    src="/pwa-192x192.png"
                    alt="Sami Logo"
                    className="splash-logo"
                />
            </div>
            <div className="splash-footer">
                <p className="footer-from">from</p>
                <div className="footer-brand">
                    <span className="brand-text">Sami</span>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
