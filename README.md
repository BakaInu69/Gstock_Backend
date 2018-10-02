Gstore_Backend

Dev: David

API list: 
/admin.gstock/api-docs/#

To start a local mongo connection:
- install mongodb (refer to Mongodb docs)

To install app:
- npm install 
- add env.dev: 
    JWTKEY=logixhive
    NODE_ENV=development
    LOGISTIC_PROVIDER_API_KEY=3d95cb8113693603
    MONGODB_URI_ADMIN=mongodb://localhost:27017
    MONGODB_URI_MERCHANT=mongodb://localhost:27017
    MONGODB_URI_BUYER=mongodb://localhost:27017
- migrate database with mongodump

Ports: 
- 3000 admin
- 3001 merchant
- 3002 buyer

To test:
    
    1. NODE_ENV=test npm run test

To run:
- production which use remote production MongoDB: 
    1. NODE_ENV=production npm start

- development which use local MongoDB (Mongod process running in background): 
    1. Run mongod
    2. Run mongorestore using dump folder <b>IN Refactor branch</b>
    3. NODE_ENV=development npm start

<b>*** Images are stored server side and currently we do not have a standalone file server.
Local development will only see photo on local device. ***`</b>


Backend structure based on <b>Refactor branch</b>:
 - Controllers as class
    - Instantiate with config
    - Config contains db connection, models, passports, roles
    - Extend server response via decorator

- Routes and express-validator
    - Input validation please use schema validator provided by express-validator package
    - Business logic validation do it in controller

- Mongoose as ODM
    - Mapping models to JS objects and provide many mongodb access APIs
    - For most of query, mongoose will suffice if not please use aggregate 

For mobile, buyer and public api are exposed via buyer.gstock.sg.


Pending issues:

- Parameters validation
- API documentations
- Unit testing
- Rewrite all routes to class

- Order/checkout 
    - Thorough test cases
- Comment/review
    - Thorough test cases