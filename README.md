## How to use

- Get a local instance of n8n running (see https://docs.n8n.io/hosting/)
- Import the workflow [Recherche Alternance.json](/Recherche%20Alternance.json) and "publish" it
- Create a `secrets.js` file like in the project root folder like this:

```js
const client_id = "YOUR_CLIENT_ID"  // FranceTravail API ID
const client_id = "YOUR_CLIENT_SECRET"  // FranceTravail API Secret
const token = "YOUR TOKEN" // LaBonneAlternance API Token
```

To get a FranceTravail API that works with this project, start here:
- https://francetravail.io/produits-partages/catalogue/romeo
An account is required. Make sure the ROMEO API is included in your application's permitted APIs.

To get a LaBonneAlternance API Token, start here:
- https://api.apprentissage.beta.gouv.fr/fr
An account is required.

With n8n running, simply open [index.html](/index.html) in your browser of choice, then you can search for offers with the given search fields. The latter are sent to the ROMEO API, which uses AI to find relevant ROME codes from the search query. Those codes are then used to find relevant offers, which are later parsed and filtered, and finally displayed in this simple HTML/CSS/JS frontend.