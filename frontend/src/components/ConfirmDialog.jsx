import { useEffect, useRef } from 'react';

function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    isBusy = false,
    onConfirm,
    onCancel
}) {
    const cancelButtonRef = useRef(null);
    const onCancelRef = useRef(onCancel);

    useEffect(() => {
        onCancelRef.current = onCancel;
    }, [onCancel]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        cancelButtonRef.current?.focus();
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCancelRef.current();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className='confirm-dialog-backdrop'>
            <div
                className='confirm-dialog'
                role='alertdialog'
                aria-modal='true'
                aria-labelledby='confirm-dialog-title'
                aria-describedby='confirm-dialog-message'
            >
                <h2 id='confirm-dialog-title'>{title}</h2>
                <p id='confirm-dialog-message'>{message}</p>
                <div className='confirm-dialog-actions'>
                    <button
                        type='button'
                        className='secondary-link'
                        onClick={onCancel}
                        ref={cancelButtonRef}
                        disabled={isBusy}
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        className='delete-button'
                        onClick={onConfirm}
                        disabled={isBusy}
                    >
                        {isBusy ? 'Deleting...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
