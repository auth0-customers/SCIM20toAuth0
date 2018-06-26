# SCIM 2.0 to Auth0 bridge API
This proejct creates an API that exposes Auth0 management API as a SCIM 2.0 compliant API. This is not a complete implementation, this is intended to be a "starter POC".

# Setup

## Create Client/Application
For the application to communicate with the Management API you will need to
creat a client ID and secret to be stored in the server configuration.
1. Create New Client/Application
1. Choose Non Interactive (Machine to Machine)
1. From the Quickstart tab select Auth0 Management API (A warning will appear)
1. Click the Navigate to API and Authorize Link
1. Click the authorization toggle
1. Select the following scopes: (read:users, read:user_idp_tokens, create:users,
   update:users, delete:users)

## Create API For This Application
Now an API needs to be generated for the application so that clients can request
tokens authorized to communicate with application
1. From the APIs section of the Management Dasboard click Create API
1. Name this auth0-scim2-api
1. The audience should be the domain where this application will live.
1. Click create.

## Setup environment variables
This are the values that should be configured per environment.  Make a copy of
the `env.sample` file and rename it `.env`.
* AUTH0_ISSUER_DOMAIN: Tenant domain including the auth0.com or equivalent
* AUTH0_CLIENT_ID: The Client/Application ID you created to communicate with the
  Management API
* AUTH0_CLIENT_SECRET: The secret associated with the client ID
* AUDIENCE: The audience name you gave the API for this Application

# Running Locally

## Start the server
1. If you haven't already run `npm i` to install the node dependencies
1. Run `npm start` this will start the application from the `server.js` file


## Generate a Bearer Token for the API
1. Create a bearer token by navigating to your configured API from the
   management dashboard.
1. From the test tab click the COPY TOKEN button above the response code block.

## Testing the Endpoints

### With Postman
1. Import the Postman library JSON in the postman directory
1. Create a environment with the following keys:
** domain: This should include the protocol
** token: Paste the token from above

### Example CURL call
```
curl -X GET \
  http://localhost:8080/users \
  -H 'Cache-Control: no-cache' \
  -H 'Postman-Token: c868f1b7-add5-4bbd-8e2c-5f1ce7f50404'
```

### Example return (redacted)
```
[
    {
        "schemas": [
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
        ],
        "id": "auth0|....",
        "externalId": "testuser@testdomain.com",
        "userName": "testuser@testdomain.com",
        "name": {},
        "emails": [
            {
                "value": "testuser@testdomain.com",
                "primary": true
            }
        ],
        "photos": [
            {
                "value": "...",
                "type": "photo"
            }
        ],
    }
]
```

You can now extend this API as you wish!
You might find this package useful as your project becomes more complex -
https://github.com/auth0-extensions/auth0-extension-express-tools

# Deploying as a Webtask
To deploy as a webtask you should repeat the setup steps above with a new
client/application and API configured specifically for the webtask environment.
Additionally you should create a `.webtask.env` file specific to this
environment.  This file will be used to generate the WT secrets in the following
steps.

1. Build the Webtask Code
    ```
    npm run wt:build
    ```
1. Deploy to your Webtask environment
    ```
    wt create dist/SCIM20toAuth0.extension.1.0.0.js -p <wt-profile> -n auth0-scim-api --secrets .webtask.env
    ```


