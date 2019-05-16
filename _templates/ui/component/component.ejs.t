---
to: imports/ui/components/<%=name%>/<%=name%>.js
---
import React from 'react';

<%_ antd.split(',').forEach(function(i) {
  const importName = i.trim();
  if(importName){ _%>
import <%=importName%> from 'antd/lib/<%=importName.toLowerCase()%>';
<%_ }
}); _%>

import styles from './index.less';

export default ({ <%=props%> }) => {
  return (
    <div className={styles.container}>
      // TODO: Your code goes here
    </div>
  );
};
