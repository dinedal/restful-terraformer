# RESTful-Terraformer

Controls the weather, allows you to change the weather with a POST of JSON including a zip code and desired temperature. Callbacks are not assured to be in any reasonable time frame, US only while this service is in beta.

All temperatures are in Fahrenheit.

## API documentation:

### POST - /weather/:zip

-   zip: 5 digit US Zip Code where you desire the weather to be changed.

Include a JSON body with the following parameters:

-   desired_temp: New temperature in degrees Fahrenheit for this location
-   url: Valid URL to call back to when this action is complete. Only one attempt will be made, regardless of success or failure.
-   tolerance: (Optional) (Default: 4) Report success if the current temperature is your desired temperature +/- this value.

### GET - /weather/

Returns a JSON array with all the current in-progress weather adjustments

## Server documentation

### Installation

Depends on the following:

-   NodeJS v0.4.7 (if using NVM: `nvm install v0.4.7`)
-   Redis
-   (Optional) foreman `(sudo?) gem install foreman`

After you've got the deps:

    git clone git@github.com:dinedal/restful-terraformer.git
    cd restful-terraformer
    npm install
    foreman start || node app.js

