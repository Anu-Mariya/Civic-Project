import { useContext } from 'react';
import { NotificationContext } from './NotificationContextStore';

export const useNotifications = () => useContext(NotificationContext);
