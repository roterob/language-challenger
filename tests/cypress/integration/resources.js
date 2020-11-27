
const { resources:ui } = require("../helpers/pages");

describe("resources module", () => {
  beforeEach(() => {
    cy.adminAccess();
    cy.selectMenu("Resources");
  })

  it("should show the resources module interface", () => {
    cy.get(ui.header.title).should("have.text", "Resources");
    cy.get(ui.header.count).should("have.text", "Count200");
    cy.get(ui.table.headers)
      .should($el => {
        expect($el).to.have.length(4);
        expect($el[1]).to.have.text("Type");
        expect($el[2]).to.have.text("Resource");
      });
    cy.get(ui.table.rows).should("not.have.length", 0);
  });

  it("should allow edit a resource", () => {
    cy.get(ui.table.rows).first().find("button").first().click();
    cy.get(ui.modal.header).should("have.be.exist");
  });

});
