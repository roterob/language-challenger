import React from 'react';

import withIsLoading from '../../components/hoc/with-is-loading';
import Stats from '../../components/Charts/StatChar';

import styles from '../index.less';

const UserStats = function({
  isLoading,
  isMobile,
  executions,
  correct,
  incorrect,
}) {
  return (
    !isLoading && (
      <div className={styles.extraContent}>
        {!isMobile && (
          <div className={styles.statItem} style={{ textAlign: 'center' }}>
            <p>Completed</p>
            <p>{executions}</p>
          </div>
        )}
        <div className={styles.statItem}>
          <p>Global</p>
          <Stats stats={{ correct, incorrect }} height={30} />
        </div>
      </div>
    )
  );
};

export default withIsLoading(UserStats);
