import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const NotificationContext = createContext(null);

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

export const NotificationProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const timer = useRef();

  const processQueue = useCallback(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setCurrent(next);
    setQueue(q => q.slice(1));
  }, [current, queue]);

  const show = useCallback((n) => {
    setQueue(q => [...q, { id: Date.now(), autoHide: 4000, severity: 'info', ...n }]);
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setCurrent(null);
  };

  React.useEffect(() => {
    if (!current) processQueue();
    else if (!timer.current) {
      timer.current = setTimeout(() => {
        setCurrent(null);
        timer.current = null;
      }, current.autoHide);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [current, processQueue]);

  return (
    <NotificationContext.Provider value={{ showNotification: show }}>
      {children}
      <Snackbar
        key={current?.id}
        open={Boolean(current)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={SlideTransition}
      >
        <Alert onClose={handleClose} severity={current?.severity || 'info'} variant="filled" sx={{ width: '100%' }}>
          {current?.title && <strong style={{ display: 'block', marginBottom: 4 }}>{current.title}</strong>}
          {current?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
