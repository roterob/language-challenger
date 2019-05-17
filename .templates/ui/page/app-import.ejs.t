---
to: imports/ui/layouts/App/App.js
inject: true
after: const LoginPage
eof_last: false
---
const <%=name%>Page = React.lazy(() => import('../../pages/<%=name%>'));
