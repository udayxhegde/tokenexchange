# Exchange a token to an Azure AD managed identity token

Code experiment, to send a token and request an AAD access token for a given managed identity

Getting Started

Run this code in an Azure Webapp, and configure the webapp with as many user managed identities as needed.

The idea is that you can first setup a trust for a foreign token with a managed id.
And then later on ask for a token exchange, by sending the foreigh token and asking for an access token for the managed identity.

The trust setup (currently not implemented) is setup by calling /api/trust with {iss: <url>, sub: <subject name in incoming token>}, and client_id of managed identity. 

The token exchange (currently implemented, and it always assumes the incomging token is trusted and always returns an access token, till trust api is implemented), is called at /api/token/exchange with a json containing: 
    subjectToken : <..>,
    clientId: <managed id for which token is requested>,
    scopes: <...>,
    options: <...>


Prerequisites

run this in a webapp in Azure that is assigned multiple managed identities.
Make sure these identities are granted access to the resources in Azure such as keyvault, storage and others: so that when you get an access token you can check that you can access those resources.

Installing

npm run build, builds the js files
npm run start, runs the server

Running:
This implements 1 api:
post: /api/token/exchange

2 other APIs are still work in progress:
post and get: /api/trust

