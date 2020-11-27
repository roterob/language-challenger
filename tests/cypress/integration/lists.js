const { lists:ui } = require("../helpers/pages");

describe("lists module", () => {
  beforeEach(() => {
    cy.adminAccess();
    cy.selectMenu("Lists");
  })

  it("should show the list module interface", () => {
    cy.get(ui.header.title).should("have.text", "Lists");
    cy.get(ui.header.count).should("have.text", "Count50");
    cy.get(ui.table.headers)
      .should($el => {
        expect($el).to.have.length(4);
        expect($el[1]).to.have.text("List");
        expect($el[2]).to.have.text("Stats");
      });
    cy.get(ui.table.rows).should("not.have.length", 0);
  });

  it("should allow start a execution", () => {
    cy.get(ui.table.rows).first().find("button").eq(0).click();
    cy.get(ui.modal.header).should("have.text", "Execution configuration");
  });

  it("should allow edit a list", () => {
    cy.get(ui.table.rows).first().find("button").eq(1).click();
    cy.get(ui.modal.header).should("have.be.exist");
  });

});
