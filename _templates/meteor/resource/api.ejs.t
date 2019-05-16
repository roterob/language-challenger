---
to: imports/startup/server/api.js
inject: true
skip_if: <%=name%>
append: true
eof_last: false
---

import '../../api/<%=name%>/methods.js';
import '../../api/<%=name%>/server/publications.js';
