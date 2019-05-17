---
to: imports/api/<%=name%>/<%=name%>.js
---
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const <%=name%> = new Mongo.Collection('<%=name%>');

<%=name%>.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

<%=name%>.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

<%=name%>.schema = new SimpleSchema({
<%_ fields.split(',').forEach(function(f) {
  const fieldName = f.trim();
  if(fieldName) { _%>
  '<%=fieldName%>': { type: String },
  <%_ }
 }); _%>
});

<%=name%>.attachSchema(<%=name%>.schema);

export default <%=name%>;
