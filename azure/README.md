# Cassandra REST API with Azure Functions in Node.js
Before running with this example, head over to the [SETUP-README](SETUP-README.md) for instructions on how to 
1. launch an instance in Azure
2. install and start a DataStax Distribution of Apache Cassandra database
3. setup your local development environment for Node.js and [serverless](https://serverless.com)

Once the above is completed, you will have all of the needed pieces in place to run this example.

## Project Details
### Files
- [index.js](index.js): Contains the Cassandra Driver connection and queries as well as the Azure Functions entry points.
- [serverless.yml](serverless.yml): Used by serverless to deploy and configure the Azure artifacts needed to run the function.
- [package.json](package.json): Defines the dependencies and descriptive example metadata.

## Run it
1. Clone this repository
```
git clone https://github.com/csplinter/datastax-serverless-examples
```
2. Go to the `datastax-serverless-examples/azure` directory
```
cd datastax-serverless-examples/azure
```
3. Install the DataStax Cassandra Driver
```
npm install cassandra-driver
```
4. Install serverless-azure-functions plugin
```
npm install serverless-azure-functions
```
5. Configure `serverless.yml` with your Contact Points ( public IP of Azure instance ), and Local Data Center ( likely `datacenter1` )
6. From the azure directory, deploy your function. This should output the endpoints that you can use to access the database.
```
sls deploy
```
* When you are done, don't forget to clean things up with
```
sls remove
```

## Using the HTTP Endpoints
#### createCatalog
Note the `-d '{}'` is required here
```
curl -X POST -d '{}' <function-app-name>.azurewebsites.net/api/catalog/create
````
expected output:
```
Successfully created shopping.catalog schema
```
#### addItem
```
curl -X POST -d '{"item_id": 0, "name": "name_0", "description": "desc_0", "price": 10.1}' <function-app-name>.azurewebsites.net/api/catalog/add
```
expected output:
```
{"query":"INSERT INTO shopping.catalog (item_id, name, description, price) VALUES (?, ?, ?, ?)","item_id":0,"name":"name_0","description":"desc_0","price":10.1}
```
#### getItem
```
curl -X GET <function-app-name>.azurewebsites.net/api/catalog/get/0
```
expected output:
```
{"query":"SELECT name, description, price FROM shopping.catalog WHERE item_id = ?","item_id":"0","name":"name_0","description":"desc_0","price":"10.1"}
```
