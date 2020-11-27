
export const login = {
  userName: "input#userName[type=text]",
  password: "input#password[type=password]",
  remmember: "input#remember[type=checkbox]",
  submit: "button.ant-btn[type=submit]",
  forgotPassword: ".login-form-forgot",
  errorBox: ".ant-alert-error",
  errorType: ".ant-alert-message",
  errorDescription: ".ant-alert-description",
  profileName: "._imports_ui_components_GlobalHeader__index__name"
}

const common = {
  header: {
    title: "._imports_ui_pages__index__contentTitle",
    count: "._imports_ui_components_PageHeaderWrapper__index__extraContent"
  },
  table: {
    headers: ".ant-table thead th",
    rows: ".ant-table tbody tr",
  },
  modal: {
    header: ".ant-modal-content .ant-modal-header"
  }
}

export const lists = Object.assign(
  {},
  common,
  {
  }
);

export const resources = Object.assign(
  {},
  common,
  {
  }
);

export const executions = Object.assign(
  {},
  common,
  {
    tabs: "div.ant-tabs-tab"
  }
);
