import { FC } from 'react';
import { SocialHub } from '@/widgets/SocialHub';
import { PageLayout } from '@/shared/ui';
import styles from './SocialPage.module.css';

export const SocialPage: FC = () => {
  return (
    <PageLayout>
      <div className={styles.socialPage}>
        <h1>Социальные взаимодействия</h1>
        <SocialHub />
      </div>
    </PageLayout>
  );
}; 