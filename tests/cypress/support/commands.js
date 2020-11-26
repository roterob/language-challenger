
Cypress.Commands.add("resetDatabase", () =>
  cy.exec('mongo mongodb://localhost:3001/meteor --eval "db.dropDatabase()"')
);

Cypress.Commands.add("executeDatabaseScript", filePath =>
  cy.exec(`mongo mongodb://localhost:3001/meteor ${filePath}`)
);
