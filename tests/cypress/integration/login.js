const { describe } = require("mocha");
const { login: ui } = require("../helpers/pages");

describe("application access", () => {
  beforeEach(() => {
    cy.visitApp();
  });

  it("should show the login interface", () => {
    cy.get(ui.userName).should("exist");
    cy.get(ui.password).should("exist");
    cy.get(ui.remmember).should("exist");
    cy.get(ui.submit).should("exist");

    cy.get(ui.forgotPassword).should("exist");
    cy.get(ui.errorBox).should("not.exist");
  });

  it("shouldn't allow user login with icorrect credentials", () => {
    cy.get(ui.userName).type("admin");
    cy.get(ui.password).type("adminNoPass");
    cy.get(ui.submit).click();

    cy.get(ui.errorBox).should("be.visible");
    cy.get(ui.errorType).should("have.text", "Error");
    cy.get(ui.errorDescription).should("have.text", "Incorrect password");
  });

  it("should allow user login with correct credentials", () => {
    cy.get(ui.userName).type("admin");
    cy.get(ui.password).type("adminPass");
    cy.get(ui.submit).click();

    cy.url().should("include", "/Executions");
    cy.get(ui.profileName).should("have.text", "Administrator");
  });

});
