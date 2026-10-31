import { useEffect } from 'react';
import { showToast } from './ui/components/Toast.jsx';

export default function LoadFailureToast({ message }) {
  useEffect(() => {
    showToast(message + ' Proverite internet konekciju.', 3500);
  }, [message]);
  return null;
}
