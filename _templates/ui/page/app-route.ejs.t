---
to: imports/ui/layouts/App/App.js
inject: true
before: </Switch>
eof_last: false
---
                <Route
                  exact
                  path="/<%=name%>"
                  render={() => <<%=name%>Page />}
                />
