import React, { PureComponent } from 'react';
import styles from './GridContent.less';
import PropTypes from 'prop-types';

class GridContent extends PureComponent {
  render() {
    const { contentWidth, children } = this.props;
    let className = `${styles.main}`;
    if (contentWidth === 'Fixed') {
      className = `${styles.main} ${styles.wide}`;
    }
    return <div className={className}>{children}</div>;
  }
}

GridContent.propTypes = {
  contentWidth: PropTypes.oneOf(['Fluid', 'Fixed']),
  children: PropTypes.element.isRequired,
};

GridContent.defaultValues = {
  contentWidth: 'Fluid',
};

export default GridContent;
