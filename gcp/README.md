# Cassandra REST API with Google Cloud Functions in Node.js
Before running with this example, head over to the [SETUP-README](SETUP-README.md) for instructions on how to 
1. launch an instance in Google Cloud
2. install and start a DataStax Distribution of Apache Cassandra database
3. setup your local development environment for Node.js and [serverless](https://serverless.com)

Once the above is completed, you will have all of the needed pieces in place to run this example.

## Project Details
### Files
- index.js: Contains the Cassandra Driver connection and queries as well as the Google Cloud Function entry points.
- serverless.yml: Used by serverless to deploy and configure the Google Cloud artifacts needed to run the function.
- package.json: Defines the dependencies and descriptive example metadata.

## Run it
1. Clone this repository
```
git clone https://github.com/csplinter/datastax-serverless-examples
```
2. Go to the `datastax-serverless-examples/gcp` directory
```
cd datastax-serverless-examples/gcp
```
3. Install the DataStax Cassandra Driver
```
npm install cassandra-driver
```
4. Install serverless-google-cloudfunctions plugin
```
npm install serverless-google-cloudfunctions
```
5. Configure `serverless.yml` with your project-id, credentials file, Contact Points ( public IP of GCP instance ), and Local Data Center ( likely `datacenter1` )
6. From the gcp directory, deploy your function. This should output the endpoints that you can use to access the database.
```
sls deploy
```

## Using the HTTP Endpoints
#### createCatalog
```
curl -X POST https://us-central1-<project-id>.cloudfunctions.net/createCatalog
````
expected output:
```
"Successfully created shopping.catalog schema"
```
#### addItem
Note the `-H "Content-Type:application/json"` is required here.
```
curl -X POST -H "Content-Type:application/json" -d '{"item_id": 0, "name": "name_0", "description": "desc_0", "price": 10.1}' https://us-central1-<project-id>.cloudfunctions.net/addItem```
expected output:
```
{"query":"INSERT INTO shopping.catalog (item_id, name, description, price) VALUES (?, ?, ?, ?)","item_id":0,"name":"name_0","description":"desc_0","price":10.1}```
#### getItem
```
curl -X GET https://us-central1-<project-id>.cloudfunctions.net/getItem/0
```
expected output:
```
{"query":"SELECT name, description, price FROM shopping.catalog WHERE item_id = ?","item_id":["0"],"name":"name_0","description":"desc_0","price":"10.1"}
```
