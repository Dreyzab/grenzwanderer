import { FC, ReactNode } from 'react';
import { NavBar } from '@/widgets';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: ReactNode;
}

export const PageLayout: FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className={styles.pageLayout}>
      <NavBar />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}; 