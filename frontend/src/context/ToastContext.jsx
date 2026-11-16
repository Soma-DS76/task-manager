
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();

        setToasts((previous) => [
            ...previous,
            { id, message, type }
        ]);

        setTimeout(() => {
            setToasts((previous) =>
                previous.filter((toast) => toast.id !== id)
            );
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts((previous) =>
            previous.filter((toast) => toast.id !== id)
        );
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div className='toast-container'>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type}`}
                    >
                        <span>{toast.message}</span>

                        <button
                            type='button'
                            onClick={() => removeToast(toast.id)}
                            aria-label='Close notification'
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used inside ToastProvider');
    }

    return context;
}
