---
to: imports/api/<%=name%>/methods.js
---
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import <%=name%> from './<%=name%>';
import handleMethodException from '../../modules/handle-method-exception';

Meteor.methods({
<%_ methods.split(',').forEach(function(m) {
  const methodName = m.trim();
  if(methodName) { _%>
  '<%=name.toLowerCase()%>.<%=methodName%>': function <%=name.toLowerCase()%><%=h.capitalize(methodName)%>() {

    try {
      // TODO: Your code goes here
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  <%_ }
 }); _%>
});
