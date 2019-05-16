---
to: defaultSettings.js
inject: true
after: "menuData: \\["
eof_last: false
---
    {
      key: '<%= name.toLowerCase() %>',
      icon: '<%= icon %>',
      name: '<%= name %>',
      path: '/<%= name %>',
    },
