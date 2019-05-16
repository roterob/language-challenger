---
to: imports/modules/dispatch.js
inject: true
skip_if: <%=name%>
before: function callback
---
import '../api/<%=name%>/methods.js';
