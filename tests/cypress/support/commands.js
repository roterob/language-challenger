import { login } from "../helpers/pages";

const APP_URL = "http://localhost:3000/";
const MONGO_URL = "mongodb://localhost:3001/meteor";

Cypress.Commands.add("resetDatabase", () =>
  cy.exec(`mongo ${ MONGO_URL } --eval "db.dropDatabase()"`)
);

Cypress.Commands.add("executeDatabaseScript", filePath =>
  cy.exec(`mongo ${ MONGO_URL } ${filePath}`)
);

Cypress.Commands.add("visitApp", () => {
    cy.visit(APP_URL);
});

Cypress.Commands.add("adminAccess", () => {
    cy.visit(APP_URL);

    cy.get(login.userName).type("admin");
    cy.get(login.password).type("adminPass");
    cy.get(login.submit).click();
});

Cypress.Commands.add("selectMenu", menu => {
  cy.get(`.ant-menu-item > a[href="/${menu}"]`).click();
});
