import { createContext, useContext } from 'react';
import { LIGHT } from './theme';

export const ThemeContext = createContext(LIGHT);
export const useTheme = () => useContext(ThemeContext);
