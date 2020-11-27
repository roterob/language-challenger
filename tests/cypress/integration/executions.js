

const { executions:ui } = require("../helpers/pages");

describe("executions module", () => {
  beforeEach(() => {
    cy.adminAccess();
    cy.selectMenu("Executions");
  })

  it("should show the exectuions module interface", () => {
    cy.get(ui.header.title).should("have.text", "My activity");
    // cy.get(ui.header.count).should("have.text", "Count200");

    cy.get(ui.tabs).should("have.length", 2);
    const tabLists = cy.get(ui.tabs).eq(0);
    tabLists.should("have.text", "Lists")

    cy.get(ui.table.headers)
      .should($el => {
        expect($el).to.have.length(4);
        expect($el[1]).to.have.text("List");
        expect($el[2]).to.have.text("Stats");
      });
    cy.get(ui.table.rows).should("not.have.length", 0);

    const tabResources = cy.get(ui.tabs).eq(1);
    tabResources.should("have.text", "Resources")

    tabResources.click();
    cy.get(ui.table.headers)
      .should($el => {
        expect($el).to.have.length(7);
        expect($el[3]).to.have.text("Resource");
        expect($el[4]).to.have.text("Result");
        expect($el[5]).to.have.text("Errors");
      });
    cy.get(ui.table.rows).should("have.length", 0);
  });

});
