import { createContext, useContext } from 'react';

type DrawerContextValue = {
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerContext provider');
  }
  return context;
};

export default DrawerContext;

