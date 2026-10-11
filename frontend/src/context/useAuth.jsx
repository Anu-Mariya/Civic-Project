import { useContext } from 'react';
import { AuthContext } from './AuthContextStore';

export const useAuth = () => useContext(AuthContext);
