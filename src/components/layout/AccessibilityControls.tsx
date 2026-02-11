import { useEffect, useState } from 'react';

const AccessibilityControls = () => {
    const [fontSize, setFontSize] = useState(1); // 1 = normal, 1.2 = A+, 0.8 = A-
    const [highContrast, setHighContrast] = useState(false);

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize * 100}%`;
        if (highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }, [fontSize, highContrast]);

    return (
        <div className="flex items-center gap-2 text-xs border-b bg-gray-100 px-4 py-1">
            <span className="text-gray-600 mr-2">Screen Reader Access | Skip to main content</span>
            <div className="flex border-l pl-2 gap-2">
                <button onClick={() => setFontSize(0.8)} className="hover:underline">A-</button>
                <button onClick={() => setFontSize(1)} className="hover:underline">A</button>
                <button onClick={() => setFontSize(1.2)} className="hover:underline">A+</button>
            </div>
            <div className="flex border-l pl-2 gap-2">
                <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`px-1 rounded ${highContrast ? 'bg-black text-white' : 'bg-white text-black border'}`}
                >
                    High Contrast
                </button>
            </div>
        </div>
    );
};

export default AccessibilityControls;
