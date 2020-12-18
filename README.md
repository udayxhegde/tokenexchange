# Exchange a token to an Azure AD managed identity token

Code experiment, to send a token and request an AAD access token for a given managed identity

Getting Started
This has 2 APIs

POST /api/token/exchange with body:
    subjectToken : <..>,
    clientId: <managed id for which token is requested>,
    scopes: <...>,
    options: <...>

if subjectoken has subject and issuer as trusted on clientid, a token is issued (issuer is not checked right now)

GET /api/trust/ returns all trusts
GET /api/trust/id returns all managed ids that can be used
GET /api/trust/id/:id returns all trust for managed id
GET /api/trust/id/:id/federatedid/:subject gets the trust if it exists for that subject on id

POST /api/trust/id/:id with body {issuer:<issuer>, subject:<subject>}. 
Subject has to be unique on a given id, otherwise error

DELETE /api/trust/id/:id/federatedid/:subject deletes the trust

examples:
GET /api/trust/id/e51a646e-abb0-4c17-af80-2072586c09be/
POST /api/trust/id/e51a646e-abb0-4c17-af80-2072586c09be
body { "issuer": issuer url,    "subject":"system:serviceaccount:tf-team1-ns:tf-team1-sa1"}

Installing

npm run build, builds the js files
npm run start, runs the server
